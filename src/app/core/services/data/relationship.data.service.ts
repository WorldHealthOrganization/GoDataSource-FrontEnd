import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ReportDifferenceOnsetRelationshipModel, RelationshipModel } from '../../models/relationship.model';
import { ModelHelperService } from '../helper/model-helper.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { MetricContactsPerCaseModel } from '../../models/metrics/metric-contacts-per-case.model';
import { EntityType } from '../../models/entity-type';
import { MetricCasesWithContactsModel } from '../../models/metrics/metric-cases-contacts.model';
import { MetricCasesTransmissionChainsModel } from '../../models/metrics/metric-cases-transmission-chains.model';
import { MetricNewCasesWithContactsModel } from '../../models/metric-new-cases-contacts.model';
import { ReportCasesWithOnsetModel } from '../../models/report-cases-with-onset.model';
import { LabelValuePair } from '../../models/label-value-pair';
import { Constants } from '../../models/constants';
import * as moment from 'moment';
import * as _ from 'lodash';
import { EntityModel } from '../../models/entity.model';
import { FilteredRequestCache } from '../../helperClasses/filtered-request-cache';

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
     * @returns {Observable<any>}
     */
    getEntityExposuresCount(
        outbreakId: string,
        entityType: EntityType,
        entityId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<any> {
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
     * @returns {Observable<any>}
     */
    getEntityContactsCount(
        outbreakId: string,
        entityType: EntityType,
        entityId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<any> {
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
     * @param {number} noDaysInChains
     * @returns {Observable<MetricCasesTransmissionChainsModel>}
     */
    getCountOfCasesOutsideTheTransmissionChains(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<MetricCasesTransmissionChainsModel> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/relationships/new-cases-outside-transmission-chains/count?filter=${filter}`),
            MetricCasesTransmissionChainsModel
        );
    }

    /**
     * Get count and ids of new cases among known contacts
     * @param {string} outbreakId
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
     * Return label - value pair of Relationship objects
     * @param {any} relationship
     * @returns {LabelValuePair[]}
     */
    getLightObjectDisplay(
        relationship: RelationshipModel
    ): LabelValuePair[] {

        const lightObject = [];

        const sourcePerson = _.find(relationship.persons, person => person.source === true);
        const sourcePeople = _.find(relationship.people, people => people.model.id === sourcePerson.id);
        const destinationPeople = _.find(relationship.people, people => people.model.id !== sourcePerson.id);

        lightObject.push(new LabelValuePair(
            'LNG_RELATIONSHIP_FIELD_LABEL_SOURCE',
            sourcePeople.model.name
        ));

        lightObject.push(new LabelValuePair(
            'LNG_RELATIONSHIP_FIELD_LABEL_TARGET',
            destinationPeople.model.name
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

        return lightObject;
    }
}

