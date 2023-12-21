import * as _ from 'lodash';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { ContactFollowUpsModel } from '../../models/contact-follow-ups.model';
import { FollowUpModel } from '../../models/follow-up.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { LocationDataService } from './location.data.service';
import { MetricContactsLostToFollowUpModel } from '../../models/metrics/metric-contacts-lost-to-follow-up.model';
import { MetricContactsModel } from '../../models/metrics/metric-contacts.model';
import { MetricContactsWithSuccessfulFollowUp } from '../../models/metrics/metric.contacts-with-success-follow-up.model';
import { TeamFollowupsPerDayModel } from '../../models/team-followups-per-day.model';
import { UserFollowupsPerDayModel } from '../../models/user-followups-per-day.model';
import { RangeFollowUpsModel } from '../../models/range-follow-ups.model';
import { map, mergeMap } from 'rxjs/operators';
import { IBasicCount } from '../../models/basic-count.interface';
import { Moment } from '../../helperClasses/localization-helper';
import { EntityType } from '../../models/entity-type';
import { EntityModel } from '../../models/entity-and-relationship.model';
import { CaseModel } from '../../models/case.model';
import { ContactModel } from '../../models/contact.model';
import { ContactOfContactModel } from '../../models/contact-of-contact.model';
import { MetricCasesModel } from '../../models/metrics/metric-cases.model';
import { MetricCasesLostToFollowUpModel } from '../../models/metrics/metric-cases-lost-to-follow-up.model';
import { MetricCasesWithSuccessfulFollowUp } from '../../models/metrics/metric.cases-with-success-follow-up.model';
import { MetricCasesSeenEachDays } from '../../models/metrics/metric-cases-seen-each-days.model';

@Injectable()
export class FollowUpsDataService {
  /**
     * Constructor
     */
  constructor(
    private http: HttpClient,
    private modelHelper: ModelHelperService,
    private locationDataService: LocationDataService
  ) {}

  /**
     * Generate followups for contacts
     * @returns {Observable<ContactFollowUpsModel>}
     */
  generateFollowUps(
    outbreakId: string,
    data: {
      personType: EntityType.CASE | EntityType.CONTACT,
      startDate: string | Moment | Date,
      endDate: string | Moment | Date,
      targeted: boolean,
      overwriteExistingFollowUps: boolean,
      keepTeamAssignment: boolean,
      intervalOfFollowUp: string
    } | {
      personType: EntityType.CASE | EntityType.CONTACT,
      contactIds: string[]
    }
  ): Observable<ContactFollowUpsModel> {
    // keepTeamAssignment is relevant only if overwriteExistingFollowUps is disabled
    const options: {
      overwriteExistingFollowUps?: boolean,
      keepTeamAssignment?: boolean,
      contactIds?: string[]
    } = data;
    if (options.overwriteExistingFollowUps) {
      delete options.keepTeamAssignment;
    }

    // generate follow-ups
    return this.modelHelper.mapObservableToModel(
      this.http.post(
        `outbreaks/${outbreakId}/generate-followups`,
        options
      ),
      ContactFollowUpsModel
    );
  }

  /**
   * Retrieve the list of FollowUps from an Outbreak
   */
  getFollowUpsList(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<FollowUpModel[]> {
    // construct query
    const filter = queryBuilder.buildQuery();
    return this.modelHelper
      .mapObservableListToModel(
        this.http.get(`outbreaks/${outbreakId}/follow-ups?filter=${filter}`),
        FollowUpModel
      )
      .pipe(
        mergeMap((followUps) => {
          // determine locations that we need to retrieve
          let locationIdsToRetrieve: any = {};
          (followUps || []).forEach((followUp) => {
            if (
              followUp.address &&
              followUp.address.locationId
            ) {
              locationIdsToRetrieve[followUp.address.locationId] = true;
            }
          });

          // we don't need to retrieve locations ?
          locationIdsToRetrieve = Object.keys(locationIdsToRetrieve);
          if (locationIdsToRetrieve.length < 1) {
            return of(followUps);
          }

          // construct query builder
          const qb: RequestQueryBuilder = new RequestQueryBuilder();
          qb.filter.bySelect(
            'id',
            locationIdsToRetrieve,
            false,
            null
          );

          // retrieve locations
          return this.locationDataService
            .getLocationsList(qb)
            .pipe(
              map((locations) => {
                // map locations
                const locationsMapped = {};
                (locations || []).forEach((location) => {
                  locationsMapped[location.id] = location;
                });

                // map names to id
                return _.map(followUps, (followUp: FollowUpModel) => {
                  // map location
                  if (
                    followUp.address &&
                                        followUp.address.locationId
                  ) {
                    followUp.address.location = locationsMapped[followUp.address.locationId] ?
                      locationsMapped[followUp.address.locationId] :
                      null;
                  }

                  // finished
                  return followUp;
                });
              })
            );
        })
      );
  }

  /**
   * Retrieve Follow-up of a Contact
   */
  getFollowUp(
    outbreakId: string,
    followUpId: string,
    retrieveCreatedUpdatedBy?: boolean
  ): Observable<FollowUpModel> {
    // include contact in response
    const qb = new RequestQueryBuilder();
    qb.include('contact', true);
    qb.filter.where({
      id: followUpId
    });

    // retrieve created user & modified user information
    if (retrieveCreatedUpdatedBy) {
      qb.include('createdByUser', true);
      qb.include('updatedByUser', true);
    }

    // construct query
    const filter = qb.buildQuery();

    // since include doesn't work in GET single follow-up item, we need to use get list or make two requests ( 1 for contact and 1 for follow-up which would be slower )
    return this.modelHelper.mapObservableListToModel(
      this.http.get(`outbreaks/${outbreakId}/follow-ups?filter=${filter}`),
      FollowUpModel
    )
      .pipe(
        map((followUps: FollowUpModel[]) => followUps.pop())
      );
  }

  /**
     * Return count of follow-ups
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<IBasicCount>}
     */
  getFollowUpsCount(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<IBasicCount> {
    const filter = queryBuilder.buildQuery();
    return this.http.get(`outbreaks/${outbreakId}/follow-ups/filtered-count?filter=${filter}`);
  }

  /**
   * Add a new Follow-up for a person
   */
  createFollowUp(
    outbreakId: string,
    personModel: ContactModel | CaseModel | ContactOfContactModel,
    followUpData
  ): Observable<any> {
    return this.http.post(`outbreaks/${outbreakId}/${EntityModel.getLinkForEntityType(personModel.type)}/${personModel.id}/follow-ups`, followUpData);
  }

  /**
   * Modify an existing Follow-up for a person
   */
  modifyFollowUp(
    outbreakId: string,
    personModel: CaseModel | ContactModel | ContactOfContactModel,
    followUpId: string,
    followUpData,
    retrieveCreatedUpdatedBy?: boolean
  ): Observable<FollowUpModel> {
    return this.modelHelper.mapObservableToModel(
      this.http.put(`outbreaks/${outbreakId}/${EntityModel.getLinkForEntityType(personModel.type)}/${personModel.id}/follow-ups/${followUpId}${retrieveCreatedUpdatedBy ? '?retrieveCreatedUpdatedBy=1' : ''}`, followUpData),
      FollowUpModel
    );
  }

  /**
     * Modify multiple follow-ups
     * @param outbreakId
     * @param followUpData
     */
  bulkModifyFollowUps(
    outbreakId: string,
    followUpData,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ) {
    const whereFilter = queryBuilder.filter.generateCondition(true);
    return this.http.put(
      `outbreaks/${outbreakId}/follow-ups/bulk?where=${whereFilter}`,
      followUpData
    );
  }

  /**
     * Delete an existing Follow-up of an Outbreak
     * @param {string} outbreakId
     * @param {string} contactId
     * @param {string} followUpId
     * @returns {Observable<any>}
     */
  deleteFollowUp(outbreakId: string, contactId: string, followUpId: string): Observable<any> {
    return this.http.delete(`outbreaks/${outbreakId}/contacts/${contactId}/follow-ups/${followUpId}`);
  }

  /**
   * Delete multiple follow-ups
   */
  deleteBulkFollowUps(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<any> {
    const filter = queryBuilder.buildQuery(false);
    return this.http.post(
      `outbreaks/${outbreakId}/follow-ups/bulk/delete`, {
        filter
      }
    );
  }

  /**
   * Restore multiple follow-ups
   */
  restoreBulkFollowUps(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<FollowUpModel[]> {
    const filter = queryBuilder.buildQuery(false);
    return this.modelHelper.mapObservableListToModel(
      this.http.post(
        `outbreaks/${outbreakId}/follow-ups/bulk/restore`, {
          filter
        }
      ),
      FollowUpModel
    );
  }

  /**
     * Restore an existing Follow-up of an Outbreak
     * @param {string} outbreakId
     * @param {string} contactId
     * @param {string} followUpId
     * @returns {Observable<any>}
     */
  restoreFollowUp(outbreakId: string, contactId: string, followUpId: string): Observable<any> {
    return this.http.post(`outbreaks/${outbreakId}/contacts/${contactId}/follow-ups/${followUpId}/restore`, {});
  }

  /**
   * Get metrics for cases on follow-up lists
   * @param {string} outbreakId
   * @param queryBuilder
   * @returns {Observable<MetricContactsModel>}
   */
  getCountIdsOfCasesOnTheFollowUpList(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<MetricCasesModel> {
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableToModel(
      this.http.get(`outbreaks/${outbreakId}/cases/on-follow-up-list/count?filter=${filter}`),
      MetricCasesModel
    );
  }

  /**
     * Get metrics for contacts on follow-up lists
     * @param {string} outbreakId
     * @param queryBuilder
     * @returns {Observable<MetricContactsModel>}
     */
  getCountIdsOfContactsOnTheFollowUpList(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<MetricContactsModel> {
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableToModel(
      this.http.get(`outbreaks/${outbreakId}/contacts/on-follow-up-list/count?filter=${filter}`),
      MetricContactsModel
    );
  }

  /**
     * Get metrics for contacts not seen
     * @param {string} outbreakId
     * @param queryBuilder
     * @returns {Observable<MetricContactsModel>}
     */
  getCountIdsOfContactsNotSeen(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<MetricContactsModel> {
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableToModel(
      this.http.get(`outbreaks/${outbreakId}/follow-ups/contacts-not-seen/count?filter=${filter}`),
      MetricContactsModel
    );
  }

  /**
   * Get metrics for cases not seen
   * @param {string} outbreakId
   * @param queryBuilder
   * @returns {Observable<MetricContactsModel>}
   */
  getCountIdsOfCasesNotSeen(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<MetricCasesModel> {
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableToModel(
      this.http.get(`outbreaks/${outbreakId}/follow-ups/cases-not-seen/count?filter=${filter}`),
      MetricCasesModel
    );
  }

  /**
     * Get the number of contacts who are lost to followup
     * @param outbreakId
     * @param queryBuilder
     * @returns {Observable<Object>}
     */
  getNumberOfContactsWhoAreLostToFollowUp(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<any> {
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableToModel(
      this.http.get(`outbreaks/${outbreakId}/follow-ups/contacts-lost-to-follow-up/count?filter=${filter}`),
      MetricContactsLostToFollowUpModel
    );
  }

  /**
   * Get the number of cases who are lost to followup
   * @param outbreakId
   * @param queryBuilder
   * @returns {Observable<Object>}
   */
  getNumberOfCasesWhoAreLostToFollowUp(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<any> {
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableToModel(
      this.http.get(`outbreaks/${outbreakId}/follow-ups/cases-lost-to-follow-up/count?filter=${filter}`),
      MetricCasesLostToFollowUpModel
    );
  }

  /**
     * Retrieve the list of contacts who have successful followup
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<MetricContactsWithSuccessfulFollowUp>}
     */
  getContactsWithSuccessfulFollowUp(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<MetricContactsWithSuccessfulFollowUp> {
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableToModel(
      this.http.get(`outbreaks/${outbreakId}/follow-ups/contacts-with-successful-follow-ups/count?filter=${filter}`),
      MetricContactsWithSuccessfulFollowUp
    );
  }

  /**
   * Retrieve the list of contacts who have successful followup
   * @param {string} outbreakId
   * @param {RequestQueryBuilder} queryBuilder
   * @returns {Observable<MetricCasesWithSuccessfulFollowUp>}
   */
  getCasesWithSuccessfulFollowUp(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<MetricCasesWithSuccessfulFollowUp> {
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableToModel(
      this.http.get(`outbreaks/${outbreakId}/follow-ups/cases-with-successful-follow-ups/count?filter=${filter}`),
      MetricCasesWithSuccessfulFollowUp
    );
  }

  /**
     * get team workload
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<TeamFollowupsPerDayModel>}
     */
  getFollowUpsPerDayTeam(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<TeamFollowupsPerDayModel> {
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableToModel(
      this.http.get(`outbreaks/${outbreakId}/follow-ups/per-team-per-day/count?filter=${filter}`),
      TeamFollowupsPerDayModel
    );
  }

  /**
     * get user workload
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<UserFollowupsPerDayModel>}
     */
  getFollowUpsPerDayUser(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<UserFollowupsPerDayModel> {
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableToModel(
      this.http.get(`outbreaks/${outbreakId}/follow-ups/per-user-per-day/count?filter=${filter}`),
      UserFollowupsPerDayModel
    );
  }

  /**
     * Get counted followUps grouped by teams
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<any>}
     */
  getCountedFollowUpsGroupedByTeams(outbreakId: string, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<any> {
    const filter = queryBuilder.buildQuery();
    return this.http.get(`/outbreaks/${outbreakId}/follow-ups/per-team/count?filter=${filter}`, {});
  }

  /**
     * Retrieve the list of FollowUps grouped by contacts from an Outbreak
     * @param {string} outbreakId
     * @param queryBuilder
     * @returns {Observable<FollowUpModel[]>}
     */
  getRangeFollowUpsList(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<RangeFollowUpsModel[]> {
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableListToModel(
      this.http.get(`outbreaks/${outbreakId}/range-follow-ups?filter=${filter}`),
      RangeFollowUpsModel
    );
  }

  /**
     * Count groups => FollowUps grouped by contacts from an Outbreak
     * @param {string} outbreakId
     * @param queryBuilder
     * @returns {Observable<IBasicCount>}
     */
  getRangeFollowUpsListCount(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<IBasicCount> {
    const filter = queryBuilder.buildQuery();
    return this.http.get(`outbreaks/${outbreakId}/range-follow-ups/count?filter=${filter}`);
  }

  /**
   * Retrieve the list of new Cases who were seen each day
   */
  getNumberOfCasesSeenEachDay(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<MetricCasesSeenEachDays> {
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableToModel(
      this.http.get(`outbreaks/${outbreakId}/follow-ups/cases-seen/count?filter=${filter}`),
      MetricCasesSeenEachDays
    );
  }
}

