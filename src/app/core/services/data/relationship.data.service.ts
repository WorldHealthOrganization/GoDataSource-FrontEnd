import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { RelationshipModel } from '../../models/relationship.model';
import { ModelHelperService } from '../helper/model-helper.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { MetricContactsPerCaseModel } from '../../models/metrics/metric-contacts-per-case.model';
import { EntityType } from '../../models/entity-type';
import { MetricCasesWithContactsModel } from '../../models/metrics/metric-cases-contacts.model';
import * as _ from 'lodash';
import { MetricNewCasesWithContactsModel } from '../../models/metric-new-cases-contacts.model';

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
        switch (entityType) {
            case EntityType.CASE:
                return 'cases';
            case EntityType.CONTACT:
                return 'contacts';
            case EntityType.EVENT:
                return 'events';
        }
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
        qb.include('people');

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
        relationshipId: string,
    ): Observable<any> {
        return this.http.delete(
            `outbreaks/${outbreakId}/${this.getLinkPathFromEntityType(entityType)}/${entityId}/relationships/${relationshipId}`
        );
    }

    /**
     * Modify a Relationship between 2 entities (Cases / Contacts / Events)
     * @param {string} outbreakId
     * @param {EntityType} entityType
     * @param {string} entityId
     * @param {string} relationshipId
     * @param relationshipData
     * @returns {Observable<any>}
     */
    modifyRelationship(
        outbreakId: string,
        entityType: EntityType,
        entityId: string,
        relationshipId: string,
        relationshipData
    ): Observable<any> {
        return this.http.put(
            `outbreaks/${outbreakId}/${this.getLinkPathFromEntityType(entityType)}/${entityId}/relationships/${relationshipId}`,
            relationshipData
        );
    }

    /**
     * Get metrics for contacts per case
     * @param {string} outbreakId
     * @returns {Observable<MetricContactsPerCaseModel>}
     */
    getMetricsOfContactsPerCase(outbreakId: string): Observable<MetricContactsPerCaseModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/relationships/contacts-per-case/count`),
            MetricContactsPerCaseModel
        );
    }

    /**
     * Get count and ids of cases with less than x contacts
     * @param {string} outbreakId
     * @param {number} noLessContacts
     * @returns {Observable<MetricCasesWithContactsModel>}
     */
    getCountIdsOfCasesLessThanXContacts(outbreakId: string, noLessContacts: number = null): Observable<MetricCasesWithContactsModel> {
        // convert noLessContacts to number as the API expects
        noLessContacts = _.parseInt(noLessContacts);
        // create filter for daysNotSeen
        const filterQueryBuilder = new RequestQueryBuilder();
        filterQueryBuilder.filter.where(
            {noLessContacts: noLessContacts}
        );
        const filter = filterQueryBuilder.filter.generateFirstCondition(true, true);
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/relationships/cases-with-less-than-x-contacts/count?filter=${filter}`),
            MetricCasesWithContactsModel
        );
    }

    /**
     * Get count and ids of new cases among known contacts
     * @param {string} outbreakId
     * @param {number} noDaysAmongContacts
     * @returns {Observable<MetricNewCasesWithContactsModel>}
     */
    getCountIdsOfCasesAmongKnownContacts(outbreakId: string, noDaysAmongContacts: number = null): Observable<MetricNewCasesWithContactsModel> {
        // convert noLessContacts to number as the API expects
        noDaysAmongContacts = Number(noDaysAmongContacts);
        // create filter for daysNotSeen
        const filterQueryBuilder = new RequestQueryBuilder();
        filterQueryBuilder.filter.where(
            {noDaysAmongContacts: noDaysAmongContacts}
        );
        const filter = filterQueryBuilder.filter.generateFirstCondition(true, true);
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/cases/new-among-known-contacts/count?filter=${filter}`),
            MetricNewCasesWithContactsModel
        );
    }
}

