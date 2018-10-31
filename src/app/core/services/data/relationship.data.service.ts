import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ReportDifferenceOnsetRelationshipModel, RelationshipModel } from '../../models/relationship.model';
import { ModelHelperService } from '../helper/model-helper.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { MetricContactsPerCaseModel } from '../../models/metrics/metric-contacts-per-case.model';
import { EntityType } from '../../models/entity-type';
import { MetricCasesWithContactsModel } from '../../models/metrics/metric-cases-contacts.model';
import * as _ from 'lodash';
import { MetricCasesTransmissionChainsModel } from '../../models/metrics/metric-cases-transmission-chains.model';
import { MetricNewCasesWithContactsModel } from '../../models/metric-new-cases-contacts.model';
import { ReportCasesWithOnsetModel } from '../../models/report-cases-with-onset.model';
import { LabelValuePair } from '../../models/label-value-pair';
import { Constants } from '../../models/constants';
import * as moment from 'moment';

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
     * Create bulk relationships
     * @param {string} outbreakId
     * @param relationshipsBulkData
     * @returns {Observable<any>}
     */
    createBulkRelationships(outbreakId: string, relationshipsBulkData: any): Observable<any> {
        return this.http.post(`outbreaks/${outbreakId}/relationships/bulk`, relationshipsBulkData);
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
     * Retrieve the total number of Relationships of a Case / Contact / Event
     * @param {string} outbreakId
     * @param {EntityType} entityType
     * @param {string} entityId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<any>}
     */
    getEntityRelationshipsCount(
        outbreakId: string,
        entityType: EntityType,
        entityId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<any> {

        const filter = queryBuilder.buildQuery();

        return this.http.get(
            `outbreaks/${outbreakId}/${this.getLinkPathFromEntityType(entityType)}/${entityId}/relationships/filtered-count?filter=${filter}`
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
     * Get count of cases in known transmission chains
     * @param {string} outbreakId
     * @param {number} noDaysInChains
     * @returns {Observable<MetricCasesTransmissionChainsModel>}
     */
    getCountOfCasesInKnownTransmissionChains(outbreakId: string, noDaysInChains: number = null): Observable<MetricCasesTransmissionChainsModel> {
        // convert noLessContacts to number as the API expects
        noDaysInChains = Number(noDaysInChains);
        // create filter for daysNotSeen
        const filterQueryBuilder = new RequestQueryBuilder();
        filterQueryBuilder.filter.where(
            {noDaysInChains: noDaysInChains}
        );
        const filter = filterQueryBuilder.filter.generateFirstCondition(true, true);
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/relationships/new-cases-in-transmission-chains/count?filter=${filter}`),
            MetricCasesTransmissionChainsModel
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
     * Return label - value pair of Relationship objects
     * @param {any} relationship
     * @returns {LabelValuePair[]}
     */
    getLightObjectDisplay(
        relationship: any
    ): LabelValuePair[] {

        const lightObject = [];
        // dialog title: Case Details
        lightObject.push(new LabelValuePair(
            'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_RELATIONSHIP_DIALOG_TITLE',
            ''
        ));

        // dialog fields
        lightObject.push(new LabelValuePair(
            'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE',
            relationship.contactDate ?
                moment(relationship.contactDate).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
                ''
        ));
        lightObject.push(new LabelValuePair(
            'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL',
            relationship.certaintyLevelId
        ));
        lightObject.push(new LabelValuePair(
            'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE',
            relationship.exposureTypeId
        ));
        lightObject.push(new LabelValuePair(
            'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY',
            relationship.exposureFrequencyId
        ));
        lightObject.push(new LabelValuePair(
            'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION',
            relationship.exposureDurationId
        ));
        lightObject.push(new LabelValuePair(
            'LNG_RELATIONSHIP_FIELD_LABEL_RELATION',
            relationship.socialRelationshipTypeId
        ));
        lightObject.push(new LabelValuePair(
            'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP',
            relationship.socialRelationshipDetail
        ));
        lightObject.push(new LabelValuePair(
            'LNG_RELATIONSHIP_FIELD_LABEL_COMMENT',
            relationship.comment
        ));
        // insert link to full resource
        lightObject.push(new LabelValuePair(
            'LINK',
            `/relationships/${relationship.sourceType}/${relationship.source}/${relationship.id}/view`
        ));

        return lightObject;
    }
}

