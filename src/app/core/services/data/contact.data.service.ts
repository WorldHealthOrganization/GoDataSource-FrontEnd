import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { ContactModel } from '../../models/contact.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { MetricContactsSeenEachDays } from '../../models/metrics/metric-contacts-seen-each-days.model';
import { AddressModel } from '../../models/address.model';
import { RiskLevelGroupModel } from '../../models/risk-level-group.model';
import { EntityModel } from '../../models/entity.model';
import { EntityType } from '../../models/entity-type';
import { EntityDuplicatesModel } from '../../models/entity-duplicates.model';
import { VisualIdErrorModel, VisualIdErrorModelCode } from '../../models/visual-id-error.model';
import * as _ from 'lodash';
import { IGeneralAsyncValidatorResponse } from '../../../shared/xt-forms/validators/general-async-validator.directive';

@Injectable()
export class ContactDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {
    }

    /**
     * Retrieve the list of Contacts for an Outbreak
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<ContactModel[]>}
     */
    getContactsList(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<ContactModel[]> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/contacts?filter=${filter}`),
            ContactModel
        );
    }

    /**
     * Return total number of contacts
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<any>}
     */
    getContactsCount(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<any> {

        const filter = queryBuilder.buildQuery();

        return this.http.get(`outbreaks/${outbreakId}/contacts/filtered-count?filter=${filter}`);
    }

    /**
     * Delete an existing Contact of an Outbreak
     * @param {string} outbreakId
     * @param {string} contactId
     * @returns {Observable<any>}
     */
    deleteContact(outbreakId: string, contactId: string): Observable<any> {
        return this.http.delete(`outbreaks/${outbreakId}/contacts/${contactId}`);
    }

    /**
     * Add a new Contact for an Outbreak
     * @param {string} outbreakId
     * @param contactData
     * @returns {Observable<any>}
     */
    createContact(outbreakId: string, contactData): Observable<any> {
        return this.http.post(`outbreaks/${outbreakId}/contacts`, contactData);
    }

    /**
     * Retrieve a Contact of an Outbreak
     * @param {string} outbreakId
     * @param {string} contactId
     * @returns {Observable<ContactModel>}
     */
    getContact(outbreakId: string, contactId: string): Observable<ContactModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/contacts/${contactId}`),
            ContactModel
        );
    }

    /**
     * Retrieve Contact movement information
     * @param {string} outbreakId
     * @param {string} contactId
     * @returns {Observable<AddressModel[]>}
     */
    getContactMovement(outbreakId: string, contactId: string): Observable<AddressModel[]> {
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/contacts/${contactId}/movement`),
            AddressModel
        );
    }

    /**
     * Find contact duplicates
     * @param outbreakId
     * @param contactData
     */
    findDuplicates(
        outbreakId: string,
        contactData: any,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<EntityDuplicatesModel> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableToModel(
            this.http.post(
                `outbreaks/${outbreakId}/contacts/duplicates/find?filter=${filter}`,
                contactData
            ),
            EntityDuplicatesModel
        );
    }

    /**
     * Modify an existing Contact of an Outbreak
     * @param {string} outbreakId
     * @param {string} contactId
     * @param contactData
     * @returns {Observable<ContactModel>}
     */
    modifyContact(outbreakId: string, contactId: string, contactData): Observable<ContactModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.put(`outbreaks/${outbreakId}/contacts/${contactId}`, contactData),
            ContactModel
        );
    }

    /**
     * Add multiple Contacts for a Case or Event
     * @param outbreakId
     * @param sourceEntityType
     * @param sourceEntityId
     * @param contactsData
     */
    bulkAddContacts(outbreakId: string, sourceEntityType: EntityType, sourceEntityId: string, contactsData: any[]): Observable<any> {
        const entityTypeLinkPath = EntityModel.getLinkForEntityType(sourceEntityType);

        return this.http.post(`outbreaks/${outbreakId}/${entityTypeLinkPath}/${sourceEntityId}/contacts`, contactsData);
    }

    /**
     * Retrieve the list of contacts grouped by the risk level
     * @param {string} outbreakId
     * @returns {Observable<RiskLevelGroupModel>}
     */
    getContactsGroupedByRiskLevel(outbreakId: string, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<RiskLevelGroupModel> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/contacts/per-risk-level/count?filter=${filter}`),
            RiskLevelGroupModel
        );
    }

    /**
     * Retrieve the list of new Contacts who were seen each day
     * @param {string} outbreakId
     * @returns {Observable<MetricContactsSeenEachDays>}
     */
    getNumberOfContactsSeenEachDay(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<MetricContactsSeenEachDays> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/follow-ups/contacts-seen/count?filter=${filter}`),
            MetricContactsSeenEachDays
        );
    }

    /**
     * Restore a contact that was deleted
     * @param {string} outbreakId
     * @param {string} contactId
     * @returns {Observable<Object>}
     */
    restoreContact(outbreakId: string, contactId: string): Observable<any> {
        return this.http.post(`/outbreaks/${outbreakId}/contacts/${contactId}/restore`, {});
    }

    /**
     * Convert a contact to case
     * @param {string} outbreakId
     * @param {string} contactId
     * @returns {Observable<any>}
     */
    convertContactToCase(outbreakId: string, contactId: string): Observable<any> {
       return this.http.post(`outbreaks/${outbreakId}/contacts/${contactId}/convert-to-case`, {});
    }

    /**
     * Generate Contact Visual ID
     * @param outbreakId
     * @param visualIdMask
     * @param personId Optional
     */
    generateContactVisualID(
        outbreakId: string,
        visualIdMask: string,
        personId?: string
    ): Observable<string | VisualIdErrorModel> {
        return this.http
            .post(
                `outbreaks/${outbreakId}/contacts/generate-visual-id`,
                {
                    visualIdMask: visualIdMask,
                    personId: personId
                }
            ).catch((response: Error | VisualIdErrorModel) => {
                return (response as VisualIdErrorModel).code === VisualIdErrorModelCode.INVALID_VISUAL_ID_MASK ||
                    (response as VisualIdErrorModel).code === VisualIdErrorModelCode.DUPLICATE_VISUAL_ID ?
                    Observable.of(
                        this.modelHelper.getModelInstance(
                            VisualIdErrorModel,
                            response
                        )
                    ) :
                    Observable.throw(response);
            });
    }

    /**
     * Check if visual ID is valid
     * @param outbreakId
     * @param visualIdRealMask
     * @param visualIdMask
     * @param personId Optional
     */
    checkContactVisualIDValidity(
        outbreakId: string,
        visualIdRealMask: string,
        visualIdMask: string,
        personId?: string
    ): Observable<boolean | IGeneralAsyncValidatorResponse> {
        return this.generateContactVisualID(
            outbreakId,
            visualIdMask,
            personId
        ).map((visualID: string | VisualIdErrorModel) => {
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
        });
    }
}

