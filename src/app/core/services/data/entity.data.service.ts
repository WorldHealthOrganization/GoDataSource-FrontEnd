import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CaseModel } from '../../models/case.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { CaseDataService } from './case.data.service';
import { ContactDataService } from './contact.data.service';
import { EventDataService } from './event.data.service';
import { EntityType } from '../../models/entity-type';
import { ContactModel } from '../../models/contact.model';
import { EventModel } from '../../models/event.model';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';
import { EntityModel } from '../../models/entity-and-relationship.model';
import { LabelValuePair } from '../../models/label-value-pair';
import { Constants } from '../../models/constants';
import { I18nService } from '../helper/i18n.service';
import { map } from 'rxjs/operators';
import { moment } from '../../helperClasses/x-moment';
import { IBasicCount } from '../../models/basic-count.interface';

@Injectable()
export class EntityDataService {
    // entity map
    entityMap = {
        [EntityType.CASE]: {
            dataService: this.caseDataService,
            getMethod: 'getCase',
            deleteMethod: 'deleteCase',
            modifyMethod: 'modifyCase',
            getRelationshipsCountMethod: 'getCaseRelationshipsCount'
        },
        [EntityType.CONTACT]: {
            dataService: this.contactDataService,
            getMethod: 'getContact',
            deleteMethod: 'deleteContact',
            modifyMethod: 'modifyContact',
            getRelationshipsCountMethod: 'getContactRelationshipsCount'
        },
        [EntityType.EVENT]: {
            dataService: this.eventDataService,
            getMethod: 'getEvent',
            deleteMethod: 'deleteEvent',
            modifyMethod: 'modifyEvent',
            getRelationshipsCountMethod: 'getEventRelationshipsCount'
        }
    };

    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private caseDataService: CaseDataService,
        private contactDataService: ContactDataService,
        private eventDataService: EventDataService,
        private i18nService: I18nService
    ) {}

    /**
     * Retrieve the list of Cases, Contacts and Events for an Outbreak
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<(CaseModel | ContactModel | EventModel)[]>}
     */
    getEntitiesList(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<(CaseModel | ContactModel | EventModel)[]> {

        const qb = new RequestQueryBuilder();
        // include relation for Events
        qb.include('location', true);
        // include relation for Cases / Contacts
        qb.include('locations', true);

        qb.merge(queryBuilder);

        const filter = qb.buildQuery();

        return this.http.get(`outbreaks/${outbreakId}/people?filter=${filter}`)
            .pipe(
                map((peopleList) => {
                    return _.map(peopleList, (entity) => {
                        return new EntityModel(entity).model;
                    });
                })
            );
    }

    /**
     * Return total number of Cases, Contacts and Events for an Outbreak
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<IBasicCount>}
     */
    getEntitiesCount(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<IBasicCount> {
        const whereFilter = queryBuilder.filter.generateCondition(true);
        return this.http.get(`outbreaks/${outbreakId}/people/count?where=${whereFilter}`);
    }

    /**
     * Retrieve an Entity of an Outbreak
     * @param {EntityType} entityType
     * @param {string} entityId
     * @param {string} outbreakId
     * @returns {Observable<CaseModel|ContactModel|EventModel>}
     */
    getEntity(
        entityType: EntityType,
        outbreakId: string,
        entityId: string
    ): Observable<CaseModel | ContactModel | EventModel> {

        const dataService = this.entityMap[entityType].dataService;
        const method = this.entityMap[entityType].getMethod;

        return dataService[method](outbreakId, entityId);
    }

    /**
     * Delete a Person of an Outbreak
     * @param {EntityType} entityType
     * @param {string} entityId
     * @param {string} outbreakId
     */
    deleteEntity(
        entityType: EntityType,
        outbreakId: string,
        entityId: string
    ): Observable<any> {
        const dataService = this.entityMap[entityType].dataService;
        const method = this.entityMap[entityType].deleteMethod;

        return dataService[method](outbreakId, entityId);
    }

    /**
     * Modify a Person of an Outbreak
     * @param {EntityType} entityType
     * @param {string} outbreakId
     * @param {string} entityId
     * @param entityData
     */
    modifyEntity(
        entityType: EntityType,
        outbreakId: string,
        entityId: string,
        entityData
    ): Observable<any> {
        const dataService = this.entityMap[entityType].dataService;
        const method = this.entityMap[entityType].modifyMethod;

        return dataService[method](outbreakId, entityId, entityData);
    }

    /**
     * Return label - value pair of Entity objects
     * @param {EntityModel} entity
     * @returns {LabelValuePair[]}
     */
    getLightObjectDisplay(
        entity: CaseModel | EventModel | ContactModel
    ): LabelValuePair[] {

        const lightObject = [];

        // entity type = Case
        if (entity instanceof CaseModel) {
            lightObject.push(new LabelValuePair(
                'LNG_CASE_FIELD_LABEL_FIRST_NAME',
                entity.firstName
            ));
            lightObject.push(new LabelValuePair(
                'LNG_CASE_FIELD_LABEL_LAST_NAME',
                entity.lastName
            ));
            // display age. decide between years and months
            let ageUnit = this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS');
            let ageValue = _.get(entity, 'age.years', 0);
            const ageMonths = _.get(entity, 'age.months', 0);
            if (ageMonths > 0) {
                // show age in months
                ageUnit = this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS');
                ageValue = ageMonths;
            }
            lightObject.push(new LabelValuePair(
                'LNG_CASE_FIELD_LABEL_AGE',
                `${ageValue} ${ageUnit}`
            ));
            lightObject.push(new LabelValuePair(
                'LNG_CASE_FIELD_LABEL_GENDER',
                entity.gender
            ));
            lightObject.push(new LabelValuePair(
                'LNG_CASE_FIELD_LABEL_OCCUPATION',
                entity.occupation
            ));
            lightObject.push(new LabelValuePair(
                'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
                entity.classification
            ));
            lightObject.push(new LabelValuePair(
                'LNG_CASE_FIELD_LABEL_LAST_VISUAL_ID',
                entity.visualId
            ));
            lightObject.push(new LabelValuePair(
                'LNG_CASE_FIELD_LABEL_RISK_LEVEL',
                entity.riskLevel
            ));
            lightObject.push(new LabelValuePair(
                'LNG_CASE_FIELD_LABEL_RISK_REASON',
                entity.riskReason
            ));
            lightObject.push(new LabelValuePair(
                'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET',
                entity.dateOfOnset ?
                    moment(entity.dateOfOnset).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
                    ''
            ));
            lightObject.push(new LabelValuePair(
                'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE',
                entity.dateBecomeCase ?
                    moment(entity.dateBecomeCase).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
                    ''
            ));
            lightObject.push(new LabelValuePair(
                'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION',
                entity.dateOfInfection ?
                    moment(entity.dateOfInfection).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
                    ''
            ));
            lightObject.push(new LabelValuePair(
                'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING',
                entity.dateOfReporting ?
                    moment(entity.dateOfReporting).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
                    ''
            ));
        }

        // entity type = Contact
        if (entity instanceof ContactModel) {
            lightObject.push(new LabelValuePair(
                'LNG_CONTACT_FIELD_LABEL_FIRST_NAME',
                entity.firstName
            ));
            lightObject.push(new LabelValuePair(
                'LNG_CONTACT_FIELD_LABEL_LAST_NAME',
                entity.lastName
            ));
            // display age. decide between years and months
            let ageUnit = this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS');
            let ageValue = _.get(entity, 'age.years', 0);
            const ageMonths = _.get(entity, 'age.months', 0);
            if (ageMonths > 0) {
                // show age in months
                ageUnit = this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS');
                ageValue = ageMonths;
            }
            lightObject.push(new LabelValuePair(
                'LNG_CONTACT_FIELD_LABEL_AGE',
                `${ageValue} ${ageUnit}`
            ));
            lightObject.push(new LabelValuePair(
                'LNG_CONTACT_FIELD_LABEL_GENDER',
                entity.gender
            ));
            lightObject.push(new LabelValuePair(
                'LNG_CONTACT_FIELD_LABEL_OCCUPATION',
                entity.occupation
            ));
            lightObject.push(new LabelValuePair(
                'LNG_CONTACT_FIELD_LABEL_VISUAL_ID',
                entity.visualId
            ));
            lightObject.push(new LabelValuePair(
                'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
                entity.dateOfReporting ?
                    moment(entity.dateOfReporting).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
                    ''
            ));
            lightObject.push(new LabelValuePair(
                'LNG_CONTACT_FIELD_LABEL_RISK_LEVEL',
                entity.riskLevel
            ));
            lightObject.push(new LabelValuePair(
                'LNG_CONTACT_FIELD_LABEL_RISK_REASON',
                entity.riskReason
            ));
        }

        // entity type = Event
        if (entity instanceof EventModel) {
            lightObject.push(new LabelValuePair(
                'LNG_EVENT_FIELD_LABEL_NAME',
                entity.name
            ));
            lightObject.push(new LabelValuePair(
                'LNG_EVENT_FIELD_LABEL_DATE',
                entity.date ?
                    moment(entity.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
                    ''
            ));
            lightObject.push(new LabelValuePair(
                'LNG_EVENT_FIELD_LABEL_DESCRIPTION',
                entity.description
            ));
            lightObject.push(new LabelValuePair(
                'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING',
                entity.dateOfReporting ?
                    moment(entity.dateOfReporting).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
                    ''
            ));
        }

        return lightObject;
    }

    /**
     * Find case duplicates
     * @param outbreakId
     * @param entityType Case / Contact
     * @param entityId
     * @param queryBuilder
     */
    getEntitiesMarkedAsNotDuplicates(
        outbreakId: string,
        entityType: EntityType,
        entityId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<(CaseModel | ContactModel | EventModel)[]> {
        const filter = queryBuilder.buildQuery();
        return this.http
            .get(`outbreaks/${outbreakId}/${EntityModel.getLinkForEntityType(entityType)}/${entityId}/duplicates/marked-as-not-duplicates?filter=${filter}`)
            .pipe(
                map((peopleList) => {
                    return _.map(peopleList, (entity) => {
                        return new EntityModel(entity).model;
                    });
                })
            );
    }

    /**
     * Find case duplicates
     * @param outbreakId
     * @param entityType Case / Contact
     * @param entityId
     * @param queryBuilder
     */
    getEntitiesMarkedAsNotDuplicatesCount(
        outbreakId: string,
        entityType: EntityType,
        entityId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<IBasicCount> {
        const whereFilter = queryBuilder.filter.generateCondition(true);
        return this.http.get(`outbreaks/${outbreakId}/${EntityModel.getLinkForEntityType(entityType)}/${entityId}/duplicates/marked-as-not-duplicates/count?where=${whereFilter}`);
    }

    /**
     * Mark person as duplicate or not
     * @param outbreakId
     * @param entityType Case / Contact
     * @param entityId
     */
    markPersonAsOrNotADuplicate(
        outbreakId: string,
        entityType: EntityType,
        entityId: string,
        addRecords: string[],
        removeRecords?: string[]
    ): Observable<string[]> {
        return this.http
            .post(
                `outbreaks/${outbreakId}/${EntityModel.getLinkForEntityType(entityType)}/${entityId}/duplicates/change`, {
                    addRecords: addRecords || [],
                    removeRecords: removeRecords || []
                }
            ) as Observable<string[]>;
    }

    /**
     * Check if entity have relationships
     * @param {string} outbreakId
     * @param {EntityType} entityType
     * @param {string} entityId
     * @returns {Observable<any>}
     */
    checkEntityRelationshipsCount(
        outbreakId: string,
        entityType: EntityType,
        entityId: string, )
        : Observable<any> {
        // create data service and method
        const dataService = this.entityMap[entityType].dataService;
        const method = this.entityMap[entityType].getRelationshipsCountMethod;
        // call the method based on entity type
        return dataService[method](outbreakId, entityId);
    }
}
