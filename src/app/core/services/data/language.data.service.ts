import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { LanguageModel, LanguageTokenDetails, LanguageTokenModel } from '../../models/language.model';
import * as _ from 'lodash';
import { localLanguages } from '../../../i18n';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { map } from 'rxjs/operators';
import { moment, Moment } from '../../helperClasses/x-moment';
import { IBasicCount } from '../../models/basic-count.interface';

@Injectable()
export class LanguageDataService {
  /**
   * Constructor
   */
  constructor(
    private http: HttpClient,
    private modelHelper: ModelHelperService
  ) {}

  /**
   * Retrieve the list of Languages
   */
  getLanguagesList(qb: RequestQueryBuilder = new RequestQueryBuilder()): Observable<LanguageModel[]> {
    // retrieve languages
    const filter = qb.buildQuery();
    return this.modelHelper
      .mapObservableListToModel(
        this.http.get(`languages?filter=${filter}`),
        LanguageModel
      );
  }

  /**
   * Return total number of languages
   */
  getLanguagesCount(
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<IBasicCount> {
    const whereFilter = queryBuilder.filter.generateCondition(true);
    return this.http.get(`languages/count?where=${whereFilter}`);
  }

  /**
   * Retrieve a Language
   */
  getLanguage(languageId: string): Observable<LanguageModel> {
    // get the list of languages and find the one with the given ID
    return this.modelHelper
      .mapObservableToModel(
        this.http.get(`languages/${languageId}`),
        LanguageModel
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
   */
  getLanguageTokens(
    languageId: string,
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
      this.http.get(`languages/${languageId}/language-tokens?filter=${filter}`),
      LanguageTokenDetails
    )
      .pipe(
        map((tokenData: LanguageTokenDetails) => {
          // get the local language tokens
          const localLanguageTokens = _.get(this.getLocalLanguageTokens(), languageId, []);

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

