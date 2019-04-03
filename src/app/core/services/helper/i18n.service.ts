import { EventEmitter, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageModel, LanguageTokenModel } from '../../models/language.model';
import { StorageKey, StorageService } from './storage.service';
import { LanguageDataService } from '../data/language.data.service';
import { Observable } from 'rxjs';
import { ModelHelperService } from './model-helper.service';
import { UserDataService } from '../data/user.data.service';
import { AuthDataService } from '../data/auth.data.service';
import { map, mergeMap } from 'rxjs/operators';

@Injectable()
export class I18nService {

    private defaultLanguageId = 'english_us';

    private languageLoadedEvent = new EventEmitter<void>();
    public languageChangedEvent = new EventEmitter<void>();

    constructor(
        private translateService: TranslateService,
        private storageService: StorageService,
        private languageDataService: LanguageDataService,
        private modelHelperService: ModelHelperService,
        private userDataService: UserDataService,
        private authDataService: AuthDataService
    ) {
    }

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
     * Change the UI language and keep it in local storage
     * @param {LanguageModel} language
     * @returns {Observable<boolean>}
     */
    changeLanguage(language: LanguageModel): Observable<any> {
        // get the tokens for the selected language
        return this.languageDataService
            .getLanguageTokens(language)
            .pipe(
                mergeMap((tokens: LanguageTokenModel[]) => {
                    // add the tokens to the Language object
                    const selectedLanguage = new LanguageModel({...language, tokens});

                    // configure the TranslateService
                    this.translateService.setTranslation(selectedLanguage.id, selectedLanguage.getTokensObject());
                    this.translateService.use(selectedLanguage.id);

                    // trigger language change events
                    this.languageChangedEvent.emit();

                    return this.persistUserLanguage(language.id);
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

        return this.userDataService
            .modifyUser(authUser.id, {languageId: languageId})
            .pipe(
                mergeMap(() => {
                    return this.authDataService.reloadAndPersistAuthUser();
                })
            );
    }

    /**
     * Load authenticated user's language
     * Note: If user is NOT authenticated, or doesn't have a language selected, use the default language (english_us)
     * @returns {Observable<any>}
     */
    loadUserLanguage(): Observable<LanguageModel> {
        // get the selected language ID
        const langId = this.getSelectedLanguageId();

        // save the selected language to local storage
        this.storageService.set(StorageKey.SELECTED_LANGUAGE_ID, langId);

        // retrieve the language data
        return this.languageDataService
            .getLanguage(langId)
            .pipe(
                mergeMap((language: LanguageModel) => {
                    // get the tokens for the selected language
                    return this.languageDataService
                        .getLanguageTokens(language)
                        .pipe(
                            map((tokens: LanguageTokenModel[]) => {

                                // add the tokens to the Language object
                                language = this.modelHelperService.getModelInstance(LanguageModel, {...language, tokens});

                                // configure the TranslateService
                                this.translateService.setTranslation(language.id, language.getTokensObject());
                                this.translateService.use(language.id);

                                // translation initialized
                                this.languageLoadedEvent.emit();

                                return language;
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
    get(token, data = {}) {
        return this.translateService.get(token, data);
    }

    /**
     * Get the translation of a token
     * @param token Token to be translated
     * @param {{}} data Parameters to be replaced in translated message
     * @returns String
     */
    instant(token, data = {}) {
        return this.translateService.instant(token, data);
    }

    /**
     * Language loaded
     */
    public waitForLanguageInitialization(): Observable<void> {
        return this.languageLoadedEvent;
    }
}

