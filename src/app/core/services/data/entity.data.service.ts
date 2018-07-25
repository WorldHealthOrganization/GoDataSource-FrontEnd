import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { CaseModel } from '../../models/case.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { CaseDataService } from './case.data.service';
import { ContactDataService } from './contact.data.service';
import { EventDataService } from './event.data.service';
import { EntityType } from '../../models/entity-type';
import { ContactModel } from '../../models/contact.model';
import { EventModel } from '../../models/event.model';
import { HttpClient } from '@angular/common/http';
import 'rxjs/add/operator/mergeMap';
import * as _ from 'lodash';
import { EntityModel } from '../../models/entity.model';

@Injectable()
export class EntityDataService {

    entityMap = {
        [EntityType.CASE]: {
            dataService: this.caseDataService,
            getMethod: 'getCase'
        },
        [EntityType.CONTACT]: {
            dataService: this.contactDataService,
            getMethod: 'getContact'
        },
        [EntityType.EVENT]: {
            dataService: this.evenDataService,
            getMethod: 'getEvent'
        }
    };

    constructor(
        private http: HttpClient,
        private caseDataService: CaseDataService,
        private contactDataService: ContactDataService,
        private evenDataService: EventDataService
    ) {
    }

    /**
     * Retrieve the list of Cases, Contacts and Events for an Outbreak
     * @param {string} outbreakId
     * @returns {Observable<(CaseModel|ContactModel|EventModel)[]>}
     */
    getEntitiesList(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<(CaseModel|ContactModel|EventModel)[]> {

        const filter = queryBuilder.buildQuery();

        return this.http.get(`outbreaks/${outbreakId}/people?filter=${filter}`)
            .map((peopleList) => {
                return _.map(peopleList, (entity) => {
                    return new EntityModel(entity).model;
                });
            });
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
    ): Observable<CaseModel|ContactModel|EventModel> {

        const dataService = this.entityMap[entityType].dataService;
        const method = this.entityMap[entityType].getMethod;

        return dataService[method](outbreakId, entityId);
    }
}

