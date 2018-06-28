import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageModel, LanguageTokenModel } from '../../models/language.model';
import { StorageService, StorageKey } from './storage.service';
import { LanguageDataService } from '../data/language.data.service';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from './model-helper.service';
import { EnglishUsLang } from '../../../i18n/english_us';

@Injectable()
export class I18nService {

    private defaultLanguageId = 'english_us';
    // the list of languages
    private languages: LanguageModel[];

    constructor(
        private translateService: TranslateService,
        private storageService: StorageService,
        private languageDataService: LanguageDataService,
        private modelHelperService: ModelHelperService
    ) {
    }

    /**
     * Initialize the service by:
     *  - retrieving and caching the list of languages
     *  - retrieving and caching the tokens for the selected language
     *  - initialize the "TranslateService", setting the language to use
     */
    init() {
        // get the list of languages
        this.languageDataService
            .getLanguagesList()
            .subscribe((languages: LanguageModel[]) => {
                // cache the languages
                this.languages = languages;

                // get the selected language
                const langId = this.getSelectedLanguageId();
                let language = _.find(languages, (lang: LanguageModel) => {
                    return lang.id === langId;
                });

                // get the tokens for the selected language
                this.languageDataService
                    .getLanguageTokens(language)
                    .subscribe((tokens: LanguageTokenModel[]) => {
                        // get the local language tokens
                        const localLanguageTokens = _.get(this.getLocalLanguageTokens(), language.id, []);

                        // merge local tokens with the tokens received from server
                        tokens = [...localLanguageTokens, ...tokens];

                        // add the tokens to the Language object
                        language = this.modelHelperService.getModelInstance(LanguageModel, {...language, tokens});

                        // configure the TranslateService
                        this.translateService.setTranslation(language.id, language.getTokensObject());
                        this.translateService.use(language.id);
                    });
            });
    }

    /**
     * Temporarily, we'll keep the UI Language tokens locally
     */
    getLocalLanguageTokens() {
        const languages = [EnglishUsLang];
        const localLanguageTokens = {};

        return _.transform(languages, (result, language) => {
            result[language.id] = _.map(language.tokens, (value, token) => {
                return new LanguageTokenModel({
                    token: token,
                    translation: value
                });
            });
        }, {});
    }

    /**
     * Get the ID of the language selected by User in UI
     * Note: 'en-us' is the default language
     * @returns {string}
     */
    getSelectedLanguageId(): string {
        // get selected language ID from local storage
        const langId = this.storageService.get(StorageKey.SELECTED_LANGUAGE_ID);

        // use 'en-us' language by default
        return langId ? langId : this.defaultLanguageId;
    }

    /**
     * Change the UI language and keep it in local storage
     * @param {LanguageModel} language
     * @returns {Observable<boolean>}
     */
    changeLanguage(language: LanguageModel): Observable<boolean> {
        // get the tokens for the selected language
        return this.languageDataService
            .getLanguageTokens(language)
            .map((tokens: LanguageTokenModel[]) => {
                // add the tokens to the Language object
                const selectedLanguage = new LanguageModel({...language, tokens});

                // configure the TranslateService
                this.translateService.setTranslation(selectedLanguage.id, selectedLanguage.getTokensObject());
                this.translateService.use(selectedLanguage.id);

                // keep the selected language ID in local storage
                this.storageService.set(StorageKey.SELECTED_LANGUAGE_ID, language.id);

                return true;
            });
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

}

