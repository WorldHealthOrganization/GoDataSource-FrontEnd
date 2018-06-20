import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { LanguageModel, LanguageTokenModel } from '../../models/language.model';
import { CacheKey, CacheService } from '../helper/cache.service';
import 'rxjs/add/operator/share';

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
     * Retrieve the list of tokens for a given language
     * @param {LanguageModel} lang
     * @returns {Observable<LanguageTokenModel[]>}
     */
    getLanguageTokens(lang: LanguageModel): Observable<LanguageTokenModel[]> {
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`languages/${lang.id}/language-tokens`),
            LanguageTokenModel
        );
    }
}

