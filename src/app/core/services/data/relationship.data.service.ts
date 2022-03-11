import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { MetricContactsPerCaseModel } from '../../models/metrics/metric-contacts-per-case.model';
import { EntityType } from '../../models/entity-type';
import { MetricCasesWithContactsModel } from '../../models/metrics/metric-cases-contacts.model';
import { MetricCasesTransmissionChainsModel } from '../../models/metrics/metric-cases-transmission-chains.model';
import { MetricNewCasesWithContactsModel } from '../../models/metric-new-cases-contacts.model';
import { ReportCasesWithOnsetModel } from '../../models/report-cases-with-onset.model';
import * as _ from 'lodash';
import { EntityModel, RelationshipModel, ReportDifferenceOnsetRelationshipModel } from '../../models/entity-and-relationship.model';
import { FilteredRequestCache } from '../../helperClasses/filtered-request-cache';
import { CaseModel } from '../../models/case.model';
import { ContactModel } from '../../models/contact.model';
import { EventModel } from '../../models/event.model';
import { map } from 'rxjs/operators';
import { IBasicCount } from '../../models/basic-count.interface';
import { ContactOfContactModel } from '../../models/contact-of-contact.model';

@Injectable()
export class RelationshipDataService {
  constructor(
    private http: HttpClient,
    private modelHelper: ModelHelperService
  ) {
  }

  /**
     * Retrieve link path parameter
     * @param {string} entityType
     * @returns {string}
     */
  private getLinkPathFromEntityType(entityType: EntityType) {
    return EntityModel.getLinkForEntityType(entityType);
  }

  /**
     * Add a new Relationship for an Outbreak to a Case / Contact ...
     * @param {string} outbreakId
     * @param {EntityType} entityType
     * @param {string} entityId
     * @param relationshipData
     * @returns {Observable<any>}
     */
  createRelationship(outbreakId: string, entityType: EntityType, entityId: string, relationshipData): Observable<any> {
    return this.http.post(`outbreaks/${outbreakId}/${this.getLinkPathFromEntityType(entityType)}/${entityId}/relationships`, relationshipData);
  }

  /**
     * Reverse source and target persons from existing relationship
     * @param {string} outbreakId
     * @param {string} relationshipId
     * @param {string} sourceId
     * @param {string} targetId
     * @returns {Observable<Object>}
     */
  reverseExistingRelationship(
    outbreakId: string,
    relationshipId: string,
    sourceId: string,
    targetId: string
  ): Observable<RelationshipModel> {
    return this.modelHelper.mapObservableToModel(
      this.http.post(`outbreaks/${outbreakId}/relationships/${relationshipId}/replace-source-and-target`,
        {
          sourceId: sourceId,
          targetId: targetId
        }),
      RelationshipModel
    );
  }

  /**
     * Create bulk relationships
     * @param {string} outbreakId
     * @param relationshipsBulkData
     * @returns {Observable<any>}
     */
  createBulkRelationships(outbreakId: string, relationshipsBulkData: any): Observable<any> {
    return this.http.post(`outbreaks/${outbreakId}/relationships/bulk`, relationshipsBulkData);
  }

  /**
     * Retrieve Relationships of a Case / Contact / Event, where the person is a contact
     * @param {string} outbreakId
     * @param {EntityType} entityType
     * @param {string} entityId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<EntityModel[]>}
     */
  getEntityExposures(
    outbreakId: string,
    entityType: EntityType,
    entityId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<EntityModel[]> {
    const filter = queryBuilder.buildQuery();

    return this.modelHelper.mapObservableListToModel(
      this.http.get(`outbreaks/${outbreakId}/${this.getLinkPathFromEntityType(entityType)}/${entityId}/relationships/exposures?filter=${filter}`),
      EntityModel
    );
  }

  /**
     * Retrieve the total number of Relationships of a Case / Contact / Event, where the person is a contact
     * @param {string} outbreakId
     * @param {EntityType} entityType
     * @param {string} entityId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<IBasicCount>}
     */
  getEntityExposuresCount(
    outbreakId: string,
    entityType: EntityType,
    entityId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<IBasicCount> {
    const filter = queryBuilder.buildQuery();

    return this.http.get(
      `outbreaks/${outbreakId}/${this.getLinkPathFromEntityType(entityType)}/${entityId}/relationships/exposures/filtered-count?filter=${filter}`
    );
  }

  /**
     * Retrieve Relationships of a Case / Contact / Event, where the person is the exposure
     * @param {string} outbreakId
     * @param {EntityType} entityType
     * @param {string} entityId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<EntityModel[]>}
     */
  getEntityContacts(
    outbreakId: string,
    entityType: EntityType,
    entityId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<EntityModel[]> {
    const filter = queryBuilder.buildQuery();

    return this.modelHelper.mapObservableListToModel(
      this.http.get(`outbreaks/${outbreakId}/${this.getLinkPathFromEntityType(entityType)}/${entityId}/relationships/contacts?filter=${filter}`),
      EntityModel
    );
  }

  /**
     * Retrieve the total number of Relationships of a Case / Contact / Event, where the person is the exposure
     * @param {string} outbreakId
     * @param {EntityType} entityType
     * @param {string} entityId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<IBasicCount>}
     */
  getEntityContactsCount(
    outbreakId: string,
    entityType: EntityType,
    entityId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<IBasicCount> {
    const filter = queryBuilder.buildQuery();

    return this.http.get(
      `outbreaks/${outbreakId}/${this.getLinkPathFromEntityType(entityType)}/${entityId}/relationships/contacts/filtered-count?filter=${filter}`
    );
  }

  /**
     * Retrieve Relationships of a Case / Contact / Event
     * @param {string} outbreakId
     * @param {EntityType} entityType
     * @param {string} entityId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<RelationshipModel[]>}
     */
  getEntityRelationships(
    outbreakId: string,
    entityType: EntityType,
    entityId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<RelationshipModel[]> {

    const filter = queryBuilder.buildQuery();

    return this.modelHelper.mapObservableListToModel(
      this.http.get(`outbreaks/${outbreakId}/${this.getLinkPathFromEntityType(entityType)}/${entityId}/relationships?filter=${filter}`),
      RelationshipModel
    );
  }

  /**
     * Retrieve a Relationship between 2 entities (Cases / Contacts / Events)
     * @param {string} outbreakId
     * @param {EntityType} entityType
     * @param {string} entityId
     * @param {string} relationshipId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<RelationshipModel>}
     */
  getEntityRelationship(
    outbreakId: string,
    entityType: EntityType,
    entityId: string,
    relationshipId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<RelationshipModel> {

    const qb = new RequestQueryBuilder();
    // include people in response
    qb.include('people', true);

    qb.merge(queryBuilder);

    const filter = qb.buildQuery();

    return this.modelHelper.mapObservableToModel(
      this.http.get(
        `outbreaks/${outbreakId}/${this.getLinkPathFromEntityType(entityType)}/${entityId}/relationships/${relationshipId}?filter=${filter}`
      ),
      RelationshipModel
    );
  }

  /**
     * Delete an existing Relationship between 2 entities (Cases / Contacts / Events)
     * @param {string} outbreakId
     * @param {EntityType} entityType
     * @param {string} entityId
     * @param {string} relationshipId
     * @returns {Observable<any>}
     */
  deleteRelationship(
    outbreakId: string,
    entityType: EntityType,
    entityId: string,
    relationshipId: string
  ): Observable<any> {
    return this.http.delete(
      `outbreaks/${outbreakId}/${this.getLinkPathFromEntityType(entityType)}/${entityId}/relationships/${relationshipId}`
    );
  }

  /**
     * Delete multiple relationships at once
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<any>}
     */
  deleteBulkRelationships(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<any> {
    const selectedRelationships = queryBuilder.filter.generateCondition(true);

    return this.http.delete(
      `outbreaks/${outbreakId}/relationships/bulk?where=${selectedRelationships}`
    );
  }

  /**
     * Modify a Relationship between 2 entities (Cases / Contacts / Events)
     * @param {string} outbreakId
     * @param {EntityType} entityType
     * @param {string} entityId
     * @param {string} relationshipId
     * @param relationshipData
     * @returns {Observable<RelationshipModel>}
     */
  modifyRelationship(
    outbreakId: string,
    entityType: EntityType,
    entityId: string,
    relationshipId: string,
    relationshipData
  ): Observable<RelationshipModel> {
    return this.modelHelper.mapObservableToModel(
      this.http.put(
        `outbreaks/${outbreakId}/${this.getLinkPathFromEntityType(entityType)}/${entityId}/relationships/${relationshipId}`,
        relationshipData
      ),
      RelationshipModel
    );
  }

  /**
     * Get metrics for contacts per case
     * @param {string} outbreakId
     * @param queryBuilder
     * @returns {Observable<MetricContactsPerCaseModel>}
     */
  getMetricsOfContactsPerCase(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<MetricContactsPerCaseModel> {
    // construct query
    const filter = queryBuilder.buildQuery();

    // check if we didn't create a request already
    return FilteredRequestCache.get(
      'getMetricsOfContactsPerCase',
      filter,
      () => {
        return this.modelHelper.mapObservableToModel(
          this.http.get(`outbreaks/${outbreakId}/relationships/contacts-per-case/count?filter=${filter}`),
          MetricContactsPerCaseModel
        );
      }
    );
  }

  /**
     * Get count and ids of cases with less than x contacts
     * @param {string} outbreakId
     * @param queryBuilder
     * @returns {Observable<MetricCasesWithContactsModel>}
     */
  getCountIdsOfCasesLessThanXContacts(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<MetricCasesWithContactsModel> {
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableToModel(
      this.http.get(`outbreaks/${outbreakId}/relationships/cases-with-less-than-x-contacts/count?filter=${filter}`),
      MetricCasesWithContactsModel
    );
  }

  /**
     * Get count of cases outside the transmission chains
     * @param {string} outbreakId
     * @param queryBuilder
     * @returns {Observable<MetricCasesTransmissionChainsModel>}
     */
  getCountOfCasesInTheTransmissionChains(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<MetricCasesTransmissionChainsModel> {
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableToModel(
      this.http.get(`outbreaks/${outbreakId}/relationships/new-cases-in-transmission-chains/count?filter=${filter}`),
      MetricCasesTransmissionChainsModel
    );
  }

  /**
     * Get count and ids of new cases among known contacts
     * @param {string} outbreakId
     * @param queryBuilder
     * @returns {Observable<MetricNewCasesWithContactsModel>}
     */
  getCountIdsOfCasesAmongKnownContacts(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<MetricNewCasesWithContactsModel> {
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableToModel(
      this.http.get(`outbreaks/${outbreakId}/cases/new-among-known-contacts/count?filter=${filter}`),
      MetricNewCasesWithContactsModel
    );
  }

  /**
     * Get cases with onset date that is before the date of onset of the primary case
     * @param outbreakId
     */
  getCasesWithDateOnsetBeforePrimaryCase(outbreakId: string): Observable<ReportCasesWithOnsetModel[]> {
    return this.modelHelper.mapObservableListToModel(
      this.http.get(`outbreaks/${outbreakId}/relationships/secondary-cases-with-date-of-onset-before-primary-case`),
      ReportCasesWithOnsetModel
    );
  }

  /**
     * Get report about the long periods in the dates of onset between cases in the chain of transmission i.e. indicate where an intermediate contact may have been missed
     * @param outbreakId
     */
  getLongPeriodBetweenDateOfOnset(outbreakId: string): Observable<ReportDifferenceOnsetRelationshipModel[]> {
    return this.modelHelper.mapObservableListToModel(
      this.http.get(`outbreaks/${outbreakId}/relationships/long-periods-between-dates-of-onset-in-transmission-chains`),
      ReportDifferenceOnsetRelationshipModel
    );
  }

  /**
     * Retrieve available people of a Case / Contact / Event
     * @param {string} outbreakId
     * @param {EntityType} entityType
     * @param {string} entityId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<(CaseModel | ContactModel | EventModel | ContactOfContactModel)[]>}
     */
  getEntityAvailablePeople(
    outbreakId: string,
    entityType: EntityType,
    entityId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<(CaseModel | ContactModel | EventModel | ContactOfContactModel)[]> {
    const filter = queryBuilder.buildQuery();
    return this.http
      .get(`outbreaks/${outbreakId}/${this.getLinkPathFromEntityType(entityType)}/${entityId}/relationships/available-people?filter=${filter}`)
      .pipe(
        map((peopleList) => {
          return _.map(peopleList, (entity) => {
            return new EntityModel(entity).model;
          });
        })
      );
  }

  /**
     * Count available people of a Case / Contact / Event
     * @param {string} outbreakId
     * @param {EntityType} entityType
     * @param {string} entityId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<IBasicCount>}
     */
  getEntityAvailablePeopleCount(
    outbreakId: string,
    entityType: EntityType,
    entityId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<IBasicCount> {
    const filter = queryBuilder.buildQuery();
    return this.http.get(`outbreaks/${outbreakId}/${this.getLinkPathFromEntityType(entityType)}/${entityId}/relationships/available-people/count?filter=${filter}`);
  }

  /**
     * Change source for multiple entities
     * @param {string} outbreakId
     * @param {string} sourceId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<any>}
     */
  bulkChangeSource(
    outbreakId: string,
    sourceId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder
  ): Observable<any> {
    const whereFilter = queryBuilder.filter.generateCondition(true);
    return this.http.post(`/outbreaks/${outbreakId}/relationships/bulk-change-source`, {sourceId: sourceId, where: JSON.parse(whereFilter)});
  }
}

