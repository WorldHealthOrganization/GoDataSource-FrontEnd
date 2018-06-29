import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { LanguageModel, LanguageTokenModel } from '../../models/language.model';
import { CacheKey, CacheService } from '../helper/cache.service';
import 'rxjs/add/operator/share';
import * as _ from 'lodash';
import { localLanguages } from '../../../i18n';

@Injectable()
export class LanguageDataService {

    languageList$: Observable<any>;

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService,
        private cacheService: CacheService
    ) {
        this.languageList$ = this.http.get(`languages`).share();
    }

    /**
     * Retrieve the list of Languages
     * @returns {Observable<LanguageModel[]>}
     */
    getLanguagesList(): Observable<LanguageModel[]> {
        // get languages list from cache
        const languagesList = this.cacheService.get(CacheKey.LANGUAGES);
        if (languagesList) {
            return Observable.of(languagesList);
        } else {
            // get languages list from API
            return this.modelHelper
                .mapObservableListToModel(
                    this.languageList$,
                    LanguageModel
                )
                .do((languages) => {
                    // cache the list
                    this.cacheService.set(CacheKey.LANGUAGES, languages);
                });
        }
    }

    /**
     * Retrieve a Language
     * @returns {Observable<LanguageModel>}
     */
    getLanguage(languageId: string): Observable<LanguageModel> {
        // get the list of languages and find the one with the given ID
        return this.getLanguagesList()
            .map((languages: LanguageModel[]) => {
                return _.find(languages, {id: languageId});
            });
    }

    /**
     * Temporarily, we'll keep the UI Language tokens locally
     */
    getLocalLanguageTokens() {
        return _.transform(localLanguages, (result, language) => {
            result[language.id] = _.map(language.tokens, (value, token) => {
                return new LanguageTokenModel({
                    token: token,
                    translation: value
                });
            });
        }, {});
    }

    /**
     * Retrieve the list of tokens for a given language
     * @param {LanguageModel} lang
     * @returns {Observable<LanguageTokenModel[]>}
     */
    getLanguageTokens(lang: LanguageModel): Observable<LanguageTokenModel[]> {
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`languages/${lang.id}/language-tokens`),
            LanguageTokenModel
        ).map((tokens) => {
            // get the local language tokens
            const localLanguageTokens = _.get(this.getLocalLanguageTokens(), lang.id, []);

            // merge local tokens with the tokens received from server
            tokens = [...localLanguageTokens, ...tokens];

            return tokens;
        });
    }
}

