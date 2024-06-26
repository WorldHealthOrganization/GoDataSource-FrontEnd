import { EventEmitter, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageModel, LanguageTokenDetails } from '../../models/language.model';
import { StorageKey, StorageService } from './storage.service';
import { LanguageDataService } from '../data/language.data.service';
import { Observable } from 'rxjs';
import { UserDataService } from '../data/user.data.service';
import { AuthDataService } from '../data/auth.data.service';
import { catchError, map, mergeMap } from 'rxjs/operators';
import * as _ from 'lodash';
import { AuthModel } from '../../models/auth.model';
import { throwError } from 'rxjs/internal/observable/throwError';
import { of } from 'rxjs/internal/observable/of';
import { LocalizationHelper } from '../../helperClasses/localization-helper';

@Injectable()
export class I18nService {
  // default language
  private defaultLanguageId = 'english_us';

  // events
  private languageLoadedEvent = new EventEmitter<void>();
  public languageChangedEvent = new EventEmitter<void>();

  // used to determine if language was loaded
  get currentLang(): string {
    return this.translateService.currentLang;
  }

  /**
   * Constructor
   */
  constructor(
    private translateService: TranslateService,
    private storageService: StorageService,
    private languageDataService: LanguageDataService,
    private userDataService: UserDataService,
    private authDataService: AuthDataService
  ) {}

  /**
     * Get the ID of the language selected by User in UI
     * Note: 'english_us' is the default language
     * @returns {string}
     */
  getSelectedLanguageId(): string {
    let languageId;

    // get the authenticated user
    const authUser = this.authDataService.getAuthenticatedUser();

    // if user is authenticated and has a language selected, use it
    if (authUser && authUser.languageId) {
      languageId = authUser.languageId;
    } else {
      // get the language from local storage
      languageId = this.storageService.get(StorageKey.SELECTED_LANGUAGE_ID);
    }

    // return the selected language, or use the default one
    return languageId ? languageId : this.defaultLanguageId;
  }

  /**
     * Set tokens
     * @param languageId
     */
  private setTranslationTokens(
    languageId: string,
    tokens: {
      [key: string]: string
    },
    lastUpdateDate: string
  ) {
    // determine if we need to retrieve old tokens or replace them with new ones
    let oldDates = this.storageService.get(StorageKey.LANGUAGE_UPDATE_LAST);
    oldDates = oldDates ? oldDates : {};

    // update tokens
    this.translateService.setTranslation(
      languageId,
      tokens,
      !!oldDates[languageId]
    );

    // update date of last token retrieval for this language
    this.storageService.set(
      StorageKey.LANGUAGE_UPDATE_LAST, {
        ...oldDates,
        ...{
          [languageId]: lastUpdateDate ? lastUpdateDate : oldDates[languageId]
        }
      }
    );
  }

  /**
   * Determine when was last time we updated language tokens for current language
   */
  private determineCurrentLanguageSinceDate(languageId: string) {
    // determine since when we need to update tokens
    const loadedLanguages = this.translateService.getLangs() || [];
    const oldDates = this.storageService.get(StorageKey.LANGUAGE_UPDATE_LAST);
    return loadedLanguages.includes(languageId) && oldDates && oldDates[languageId] ? LocalizationHelper.toMoment(oldDates[languageId]) : null;
  }

  /**
   * Change the UI language and keep it in local storage
   */
  changeLanguage(languageId: string): Observable<LanguageTokenDetails | AuthModel> {
    // save the selected language to local storage
    this.storageService.set(StorageKey.SELECTED_LANGUAGE_ID, languageId);

    // get the tokens for the selected language
    return this.languageDataService
      .getLanguageTokens(languageId, this.determineCurrentLanguageSinceDate(languageId))
      .pipe(
        mergeMap((tokenData: LanguageTokenDetails) => {
          // update translation tokens
          this.setTranslationTokens(
            tokenData.languageId,
            _.transform(
              tokenData.tokens,
              (a, v) => {
                a[v.token] = v.translation;
              },
              {}
            ),
            tokenData.lastUpdateDate ? tokenData.lastUpdateDate.toISOString() : null
          );

          // same as selected language ?
          if (this.storageService.get(StorageKey.SELECTED_LANGUAGE_ID) === tokenData.languageId) {
            // set system to use the new language
            this.translateService.use(tokenData.languageId);

            // trigger language change events
            this.languageChangedEvent.emit();

            // if we're not authenticated then we can persist language
            // get the authenticated user
            const authUser = this.authDataService.getAuthenticatedUser();

            // if we're not authenticated then we don't have to set user language
            if (!authUser) {
              return of(tokenData);
            }

            // authenticated, change user settings
            return this.persistUserLanguage(tokenData.languageId);
          }

          // NOTHING TO DO...finished with this map
          return of(tokenData);
        })
      );
  }

  /**
     * Save the selected language for the authenticated user
     * @param languageId
     * @returns {Observable<any>}
     */
  persistUserLanguage(languageId): Observable<any> {
    // save the selected language to local storage
    this.storageService.set(StorageKey.SELECTED_LANGUAGE_ID, languageId);

    // get the authenticated user
    const authUser = this.authDataService.getAuthenticatedUser();

    // if we're not authenticated then we don't have to set user language
    if (!authUser) {
      return;
    }

    // finished
    return this.userDataService
      .modifyUser(authUser.id, { languageId: languageId })
      .pipe(
        mergeMap(() => {
          return this.authDataService.reloadAndPersistAuthUser();
        })
      );
  }

  /**
     * Load authenticated user's language
     * Note: If user is NOT authenticated, or doesn't have a language selected, use the default language (english_us)
     * @returns {Observable<void>}
     */
  loadUserLanguage(clearLastUpdate?: boolean): Observable<void> {
    // get the selected language ID
    const langId = this.getSelectedLanguageId();

    // save the selected language to local storage
    this.storageService.set(StorageKey.SELECTED_LANGUAGE_ID, langId);

    // reload all translations ?
    if (clearLastUpdate) {
      this.storageService.remove(StorageKey.LANGUAGE_UPDATE_LAST);
    }

    // retrieve the language data
    return this.languageDataService
      .getLanguage(langId)
      .pipe(
        catchError((err) => {
          this.languageLoadedEvent.error(err);
          return throwError(err);
        }),
        mergeMap((language: LanguageModel) => {
          // force sign in
          if (!language) {
            // force sign in to refresh language id
            this.clearStorage();
            this.authDataService.clearStorage();
            window.location.reload();

            // finished
            return;
          }

          // get the tokens for the selected language
          return this.languageDataService
            .getLanguageTokens(language.id, this.determineCurrentLanguageSinceDate(language.id))
            .pipe(
              catchError((err) => {
                this.languageLoadedEvent.error(err);
                return throwError(err);
              }),
              map((tokenData: LanguageTokenDetails) => {
                // update translation tokens
                this.setTranslationTokens(
                  tokenData.languageId,
                  _.transform(
                    tokenData.tokens,
                    (a, v) => {
                      a[v.token] = v.translation;
                    },
                    {}
                  ),
                  tokenData.lastUpdateDate ? tokenData.lastUpdateDate.toISOString() : null
                );

                // same as selected language ?
                if (this.storageService.get(StorageKey.SELECTED_LANGUAGE_ID) === tokenData.languageId) {
                  // set system to use the new language
                  this.translateService.use(tokenData.languageId);

                  // translation initialized
                  this.languageLoadedEvent.emit();
                }

                // NOTHING TO DO...finished with this map
              })
            );
        })
      );
  }

  /**
     * Get the translation of a token
     * @param token Token to be translated
     * @param {{}} data Parameters to be replaced in translated message
     * @returns {Observable<string | any>}
     */
  get(token, data = {}): Observable<string | any> {
    return this.translateService.get(token, data);
  }

  /**
     * Get the translation of a token
     * @param token Token to be translated
     * @param {{}} data Parameters to be replaced in translated message
     * @returns String
     */
  instant(token, data = {}): string {
    return this.translateService.instant(token, data);
  }

  /**
     * Language loaded
     */
  public waitForLanguageInitialization(): Observable<void> {
    return this.languageLoadedEvent;
  }

  /**
     * Remove all data from storage that is handled by this service
     */
  public clearStorage() {
    // remove language data
    this.storageService.remove(StorageKey.SELECTED_LANGUAGE_ID);
    this.storageService.remove(StorageKey.LANGUAGE_UPDATE_LAST);
  }
}

