import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ObservableHelperService } from '../helper/observable-helper.service';
import { LanguageModel, LanguageTokenModel } from '../../models/language.model';

@Injectable()
export class LanguageDataService {

    constructor(
        private http: HttpClient,
        private observableHelper: ObservableHelperService
    ) {
    }

    /**
     * Retrieve the list of Languages
     * @returns {Observable<LanguageModel[]>}
     */
    getLanguagesList(): Observable<LanguageModel[]> {
        return this.observableHelper.mapListToModel(
            this.http.get(`languages`),
            LanguageModel
        );
    }

    /**
     * Retrieve the list of tokens for a given language
     * @param {LanguageModel} lang
     * @returns {Observable<LanguageTokenModel[]>}
     */
    getLanguageTokens(lang: LanguageModel): Observable<LanguageTokenModel[]> {
        return this.observableHelper.mapListToModel(
            this.http.get(`languages/${lang.id}/language-tokens`),
            LanguageTokenModel
        );
    }
}

