import { Observable, throwError, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ModelHelperService } from '../helper/model-helper.service';
import { CaseModel } from '../../models/case.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { ListFilterDataService } from './list-filter.data.service';
import { MetricCasesCountStratified } from '../../models/metrics/metric-cases-count-stratified.model';
import { MetricCasesPerLocationCountsModel } from '../../models/metrics/metric-cases-per-location-counts.model';
import { AddressModel } from '../../models/address.model';
import { MetricCasesDelayBetweenOnsetLabTestModel } from '../../models/metrics/metric-cases-delay-between-onset-lab-test.model';
import { VisualIdErrorModel, VisualIdErrorModelCode } from '../../models/visual-id-error.model';
import * as _ from 'lodash';
import { MetricCasesDelayBetweenOnsetHospitalizationModel } from '../../models/metrics/metric-cases-delay-between-onset-hospitalization.model';
import { Constants } from '../../models/constants';
import { IGeneralAsyncValidatorResponse } from '../../../shared/xt-forms/validators/general-async-validator.directive';
import { MetricCasesCountStratifiedOutcome } from '../../models/metrics/metric-cases-count-stratified-outcome.model';
import { MetricCasesBasedOnContactStatusModel } from '../../models/metrics/metric-cases-based-on-contact-status.model';
import { catchError, map } from 'rxjs/operators';
import { IBasicCount } from '../../models/basic-count.interface';
import { ICasesHospitalizedCount } from '../../models/cases-hospitalized-count.interface';
import { LocalizationHelper } from '../../helperClasses/localization-helper';

@Injectable()
export class CaseDataService {
  /**
   * Constructor
   */
  constructor(
    private http: HttpClient,
    private modelHelper: ModelHelperService,
    private listFilterDataService: ListFilterDataService
  ) {}

  /**
   * Retrieve the list of Cases for an Outbreak
   */
  getCasesList(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder(),
    usePost?: boolean
  ): Observable<CaseModel[]> {
    // date range filter
    const qb: RequestQueryBuilder = new RequestQueryBuilder();
    qb.include('dateRangeLocations', true);
    qb.merge(queryBuilder);

    // use post
    if (usePost) {
      const filter = queryBuilder.buildQuery(false);
      return this.modelHelper.mapObservableListToModel(
        this.http.post(
          `outbreaks/${outbreakId}/cases/filter`, {
            filter
          }
        ),
        CaseModel
      );
    }

    // default
    const filter = qb.buildQuery();
    return this.modelHelper.mapObservableListToModel(
      this.http.get(`outbreaks/${outbreakId}/cases?filter=${filter}`),
      CaseModel
    );
  }

  /**
   * Retrieve a Case of an Outbreak
   */
  getCase(outbreakId: string, caseId: string): Observable<CaseModel> {
    return this.modelHelper.mapObservableToModel(
      this.http.get(`outbreaks/${outbreakId}/cases/${caseId}`),
      CaseModel
    );
  }

  /**
   * Retrieve Case movement information
   */
  getCaseMovement(outbreakId: string, caseId: string): Observable<AddressModel[]> {
    return this.modelHelper.mapObservableListToModel(
      this.http.get(`outbreaks/${outbreakId}/cases/${caseId}/movement`),
      AddressModel
    );
  }

  /**
   * Add a new Case for an Outbreak
   */
  createCase(outbreakId: string, caseData): Observable<any> {
    return this.http.post(`outbreaks/${outbreakId}/cases`, caseData);
  }

  /**
   * Modify an existing Case of an Outbreak
   */
  modifyCase(outbreakId: string, caseId: string, caseData): Observable<CaseModel> {
    return this.modelHelper.mapObservableToModel(
      this.http.put(`outbreaks/${outbreakId}/cases/${caseId}`, caseData),
      CaseModel
    );
  }

  /**
   * Delete an existing Case of an Outbreak
   */
  deleteCase(outbreakId: string, caseId: string): Observable<any> {
    return this.http.delete(`outbreaks/${outbreakId}/cases/${caseId}`);
  }

  /**
   * Get exposed contacts for a case that user want to delete/convert
   */
  getExposedContactsForCase(outbreakId: string, caseId: string) {
    return this.http.get(`outbreaks/${outbreakId}/cases/${caseId}/isolated-contacts`);
  }

  /**
   * Return count of cases
   */
  getCasesCount(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<IBasicCount> {
    const filter = queryBuilder.buildQuery();
    return this.http.get(`outbreaks/${outbreakId}/cases/filtered-count?filter=${filter}`);
  }

  /**
   * Count Cases grouped by Classification
   */
  getCasesGroupedByClassification(outbreakId: string, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<any> {
    const filter = queryBuilder.buildQuery();
    return this.http.get(`outbreaks/${outbreakId}/cases/per-classification/count?filter=${filter}`);
  }

  /**
   * Count Cases grouped by Classification
   */
  getCasesHospitalized(outbreakId: string, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<ICasesHospitalizedCount> {
    const filter = queryBuilder.buildQuery();
    return this.http.get<ICasesHospitalizedCount>(`outbreaks/${outbreakId}/cases/hospitalized/count?filter=${filter}`);
  }

  /**
   * Return count of deceased cases
   */
  getDeceasedCasesCount(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<any> {
    // construct query
    const filterQueryBuilder = new RequestQueryBuilder();

    // add other conditions
    if (!queryBuilder.isEmpty()) {
      filterQueryBuilder.merge(queryBuilder);
    }

    // deceased condition
    filterQueryBuilder.filter.where({
      outcomeId: Constants.OUTCOME_STATUS.DECEASED
    }, true);

    // generate a query builder for deceased
    const filter = filterQueryBuilder.buildQuery();
    return this.http.get(`outbreaks/${outbreakId}/cases/filtered-count?filter=${filter}`);
  }

  /**
   * Return count of hospitalised cases
   */
  getHospitalisedCasesCount(
    outbreakId: string,
    date,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<any> {
    // set default date ?
    if (!date) {
      date = LocalizationHelper.today();
    }

    // get the query builder and call the endpoint
    const filterQueryBuilder = this.listFilterDataService.filterCasesHospitalized(date);

    // add other conditions
    if (!queryBuilder.isEmpty()) {
      filterQueryBuilder.merge(queryBuilder);
    }

    // call endpoint
    const filter = filterQueryBuilder.buildQuery();
    return this.http.get(`outbreaks/${outbreakId}/cases/filtered-count?filter=${filter}`);
  }

  /**
   * Return count of suspect cases pending lab result
   */
  getCasesPendingLabResultCount(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<any> {
    // get the query builder and call the endpoint
    const filterQueryBuilder = this.listFilterDataService.filterCasesPendingLabResult();

    // add other conditions
    if (!queryBuilder.isEmpty()) {
      filterQueryBuilder.merge(queryBuilder);
    }

    // call endpoint
    const filter = filterQueryBuilder.buildQuery();
    return this.http.get(`outbreaks/${outbreakId}/cases/filtered-count?filter=${filter}`);
  }

  /**
   * Return count of cases refusing to be transferred to a treatment unit
   */
  getCasesRefusingTreatmentCount(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<any> {
    // generate a query builder for cases refusing treatment
    const filterQueryBuilder = this.listFilterDataService.filterCasesRefusingTreatment();

    // add other conditions
    if (!queryBuilder.isEmpty()) {
      filterQueryBuilder.merge(queryBuilder);
    }

    // call endpoint
    const filter = filterQueryBuilder.buildQuery();
    return this.http.get(`outbreaks/${outbreakId}/cases/filtered-count?filter=${filter}`);
  }

  /**
   * Cases count stratified by classification over time
   */
  getCasesStratifiedByClassificationOverTime(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<MetricCasesCountStratified[]> {
    const filter = queryBuilder.buildQuery();
    const obs = this.http.get(`outbreaks/${outbreakId}/cases/classification-over-time/count?filter=${filter}`);
    return obs
      .pipe(
        map(
          (listResult: any) => {
            return _.sortBy(
              _.transform(
                listResult,
                (acc, value) => {
                  acc.push(new MetricCasesCountStratified(value));
                },
                []
              ),
              'start'
            );
          }
        )
      );
  }

  /**
   * Cases count stratified by classification over reporting time
   */
  getCasesStratifiedByClassificationOverReportingTime(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<MetricCasesCountStratified[]> {
    const filter = queryBuilder.buildQuery();
    const obs = this.http.get(`outbreaks/${outbreakId}/cases/classification-over-reporting-time/count?filter=${filter}`);
    return obs
      .pipe(
        map(
          (listResult: any) => {
            return _.sortBy(
              _.transform(
                listResult,
                (acc, value) => {
                  acc.push(new MetricCasesCountStratified(value));
                },
                []
              ),
              'start'
            );
          }
        )
      );
  }

  /**
   * Cases count stratified by outcome over time
   */
  getCasesStratifiedByOutcomeOverTime(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<MetricCasesCountStratifiedOutcome[]> {
    const filter = queryBuilder.buildQuery();
    const obs = this.http.get(`outbreaks/${outbreakId}/cases/outcome-over-time/count?filter=${filter}`);
    return obs
      .pipe(
        map(
          (listResult: any) => {
            return _.sortBy(
              _.transform(
                listResult,
                (acc, value) => {
                  acc.push(new MetricCasesCountStratifiedOutcome(value));
                },
                []
              ),
              'start'
            );
          }
        )
      );
  }

  /**
   * Retrieve cases per location metrics
   */
  getCasesPerLocation(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<MetricCasesPerLocationCountsModel> {
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableToModel(
      this.http.get(`outbreaks/${outbreakId}/cases/per-location-level/count?filter=${filter}`),
      MetricCasesPerLocationCountsModel
    );
  }

  /**
   * Get delay between date of onset and date of first lab testing - gantt chart
   */
  getDelayBetweenOnsetAndLabTesting(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<MetricCasesDelayBetweenOnsetLabTestModel[]> {
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableListToModel(
      this.http.get(`outbreaks/${outbreakId}/cases/delay-onset-lab-testing?filter=${filter}`),
      MetricCasesDelayBetweenOnsetLabTestModel
    );
  }

  /**
   * Get delay between date of onset and date of hospitalization / isolation - first - gantt chart
   */
  getDelayBetweenOnsetAndHospitalization(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<MetricCasesDelayBetweenOnsetHospitalizationModel[]> {
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableListToModel(
      this.http.get(`outbreaks/${outbreakId}/cases/delay-onset-hospitalization?filter=${filter}`),
      MetricCasesDelayBetweenOnsetHospitalizationModel
    );
  }

  /**
   * Cases based on contact status report
   */
  getCasesBasedOnContactStatusReport(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<MetricCasesBasedOnContactStatusModel[]> {
    const filter = queryBuilder.buildQuery();
    const obs = this.http.get(`outbreaks/${outbreakId}/cases/per-period-per-contact-status/count?filter=${filter}`);
    return obs
      .pipe(
        map(
          (listResult: any) => {
            const results: MetricCasesBasedOnContactStatusModel[] = [];
            if (listResult.period) {
              _.forEach(listResult.period, (result) => {
                results.push(result);
              });
            }
            return results;
          }
        )
      );
  }

  /**
   * Restore a case that was deleted
   */
  restoreCase(outbreakId: string, caseId: string): Observable<any> {
    return this.http.post(`/outbreaks/${outbreakId}/cases/${caseId}/restore`, {});
  }

  /**
   * Convert a case to contact
   */
  convertToContact(outbreakId: string, caseId: string): Observable<any> {
    return this.http.post(`/outbreaks/${outbreakId}/cases/${caseId}/convert-to-contact`, {});
  }

  /**
   * Generate Case Visual ID
   */
  generateCaseVisualID(
    outbreakId: string,
    visualIdMask: string,
    personId?: string
  ): Observable<string | VisualIdErrorModel> {
    return this.http
      .post(
        `outbreaks/${outbreakId}/cases/generate-visual-id`,
        {
          visualIdMask: visualIdMask,
          personId: personId
        }
      )
      .pipe(
        catchError((response: Error | VisualIdErrorModel) => {
          return (
            (response as VisualIdErrorModel).code === VisualIdErrorModelCode.INVALID_VISUAL_ID_MASK ||
                        (response as VisualIdErrorModel).code === VisualIdErrorModelCode.DUPLICATE_VISUAL_ID
          ) ?
            of(
              this.modelHelper.getModelInstance(
                VisualIdErrorModel,
                response
              )
            ) :
            throwError(response);
        })
      );
  }

  /**
   * Check if visual ID is valid
   */
  checkCaseVisualIDValidity(
    outbreakId: string,
    visualIdRealMask: string,
    visualIdMask: string,
    personId?: string
  ): Observable<boolean | IGeneralAsyncValidatorResponse> {
    return this.generateCaseVisualID(
      outbreakId,
      visualIdMask,
      personId
    )
      .pipe(
        map((visualID: string | VisualIdErrorModel) => {
          return _.isString(visualID) ?
            true : {
              isValid: false,
              errMsg: (visualID as VisualIdErrorModel).code === VisualIdErrorModelCode.INVALID_VISUAL_ID_MASK ?
                'LNG_API_ERROR_CODE_INVALID_VISUAL_ID_MASK' :
                'LNG_API_ERROR_CODE_DUPLICATE_VISUAL_ID',
              errMsgData: {
                mask: visualIdRealMask
              }
            };
        })
      );
  }

  /**
   * Get case relationships count
   */
  getCaseRelationshipsCount(outbreakId: string, caseId: string): Observable<any> {
    return this.http.get(`outbreaks/${outbreakId}/cases/${caseId}/relationships/filtered-count`);
  }

  /**
   * Retrieve the list of usual place of residences for cases that have geo location on the usual place of residence
   */
  getCaseCountMapAddresses(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<{ lat: number, lng: number }[]> {
    // generate filter
    const filter = queryBuilder.buildQuery(false);
    const whereFilter = JSON.stringify(filter.where || {});
    return this.http.get(`outbreaks/${outbreakId}/cases/count-map?where=${whereFilter}`) as Observable<{ lat: number, lng: number }[]>;
  }
}
