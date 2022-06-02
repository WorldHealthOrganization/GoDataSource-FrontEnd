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
import { map } from 'rxjs/operators';
import { IBasicCount } from '../../models/basic-count.interface';
import { ContactOfContactModel } from '../../models/contact-of-contact.model';
import { ContactsOfContactsDataService } from './contacts-of-contacts.data.service';

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
    [EntityType.CONTACT_OF_CONTACT]: {
      dataService: this.contactsOfContactsDataService,
      getMethod: 'getContactOfContact',
      deleteMethod: 'deleteContactOfContact',
      modifyMethod: 'modifyContactOfContact',
      getRelationshipsCountMethod: undefined
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
    private contactsOfContactsDataService: ContactsOfContactsDataService,
    private eventDataService: EventDataService
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
  ): Observable<(CaseModel | ContactModel | EventModel | ContactOfContactModel)[]> {

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
    const filter = queryBuilder.buildQuery();
    return this.http.get(`outbreaks/${outbreakId}/people/filtered-count?filter=${filter}`);
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
  ): Observable<CaseModel | ContactModel | EventModel | ContactOfContactModel> {
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
  ): Observable<(CaseModel | ContactModel | EventModel | ContactOfContactModel)[]> {
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
    entityId: string
  ): Observable<any> {
    // create data service and method
    const dataService = this.entityMap[entityType].dataService;
    const method = this.entityMap[entityType].getRelationshipsCountMethod;
    // call the method based on entity type
    return dataService[method](outbreakId, entityId);
  }
}
