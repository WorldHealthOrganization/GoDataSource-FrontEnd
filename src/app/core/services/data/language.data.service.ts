import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { LanguageModel, LanguageTokenDetails, LanguageTokenModel } from '../../models/language.model';
import { CacheKey, CacheService } from '../helper/cache.service';
import * as _ from 'lodash';
import { localLanguages } from '../../../i18n';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { map, share, tap } from 'rxjs/operators';
import { Moment } from 'moment';
import * as moment from 'moment';

@Injectable()
export class LanguageDataService {

    languageList$: Observable<any>;

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService,
        private cacheService: CacheService
    ) {
        this.languageList$ = this.http.get('languages').pipe(share());
    }

    /**
     * Retrieve the list of Languages
     * @returns {Observable<LanguageModel[]>}
     */
    getLanguagesList(qb: RequestQueryBuilder = null): Observable<LanguageModel[]> {
        // retrieve languages
        if (qb) {
            // get languages list from API
            const filter = qb.buildQuery();
            return this.modelHelper
                .mapObservableListToModel(
                    this.http.get(`languages?filter=${filter}`),
                    LanguageModel
                );
        }

        // get languages list from cache
        const languagesList = this.cacheService.get(CacheKey.LANGUAGES);
        if (languagesList) {
            return of(languagesList);
        } else {
            // get languages list from API
            return this.modelHelper
                .mapObservableListToModel(
                    this.languageList$,
                    LanguageModel
                )
                .pipe(
                    tap((languages) => {
                        // cache the list
                        this.cacheService.set(CacheKey.LANGUAGES, languages);
                    })
                );
        }
    }

    /**
     * Retrieve a Language
     * @returns {Observable<LanguageModel>}
     */
    getLanguage(languageId: string): Observable<LanguageModel> {
        // get the list of languages and find the one with the given ID
        return this.getLanguagesList()
            .pipe(
                map((languages: LanguageModel[]) => {
                    return _.find(languages, {id: languageId});
                })
            );
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
     * @param updatedSince
     * @returns {Observable<LanguageTokenDetails>}
     */
    getLanguageTokens(
        lang: LanguageModel,
        updatedSince?: Moment
    ): Observable<LanguageTokenDetails> {
        // retrieve only token and translation fields to reduce the payload
        const qb = new RequestQueryBuilder();
        qb.fields('token', 'translation');

        // retrieve only tokens for updating list
        if (updatedSince) {
            qb.filter.flag('updatedSince', moment(updatedSince).toISOString());
        }

        const filter = qb.buildQuery();

        return this.modelHelper.mapObservableToModel(
            this.http.get(`languages/${lang.id}/language-tokens?filter=${filter}`),
            LanguageTokenDetails
        )
        .pipe(
            map((tokenData: LanguageTokenDetails) => {
                // get the local language tokens
                const localLanguageTokens = _.get(this.getLocalLanguageTokens(), lang.id, []);

                // merge local tokens with the tokens received from server
                tokenData.tokens = [...tokenData.tokens, ...localLanguageTokens as any[]];

                return tokenData;
            })
        );
    }

    /**
     * Delete language
     * @param {string} languageId
     * @returns {Observable<any>}
     */
    deleteLanguage(languageId: string): Observable<any> {
        return this.http.delete(`languages/${languageId}`);
    }

    /**
     * Add a new Language
     * @param languageData
     * @returns {Observable<any>}
     */
    createLanguage(languageData): Observable<any> {
        return this.http.post('languages', languageData);
    }

    /**
     * Modify Language
     * @param {string} languageId
     * @param languageData
     * @returns {Observable<LanguageModel>}
     */
    modifyLanguage(languageId: string, languageData): Observable<LanguageModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.put(`languages/${languageId}`, languageData),
            LanguageModel
        );
    }
}

