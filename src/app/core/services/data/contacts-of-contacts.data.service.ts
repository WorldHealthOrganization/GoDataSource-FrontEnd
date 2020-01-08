import {Injectable} from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import {RequestQueryBuilder} from '../../helperClasses/request-query-builder';
import { HttpClient } from '@angular/common/http';
import { ModelHelperService } from '../helper/model-helper.service';
import { ContactOfContactModel } from '../../models/contact-of-contact.model';
import { AddressModel } from '../../models/address.model';
import { EntityDuplicatesModel } from '../../models/entity-duplicates.model';
import { RiskLevelGroupModel } from '../../models/risk-level-group.model';
import { catchError, map } from 'rxjs/internal/operators';
import { VisualIdErrorModel, VisualIdErrorModelCode } from '../../models/visual-id-error.model';
import { IGeneralAsyncValidatorResponse } from '../../../shared/xt-forms/validators/general-async-validator.directive';
import { EntityModel } from '../../models/entity-and-relationship.model';
import { EntityType } from '../../models/entity-type';
import * as _ from 'lodash';

@Injectable()

export class ContactsOfContactsDataService {

    constructor(private http: HttpClient,
                private modelHelper: ModelHelperService) {

    }

    /**
     * Retrieve the list of Contacts of contacts for an Outbreak
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<ContactOfContactModel[]>}
     */
    getContactsList(outbreakId: string,
                    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<ContactOfContactModel[]> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/contacts?filter=${filter}`),
            ContactOfContactModel
        );
    }

    /**
     * Return total number of contacts of contacts
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<any>}
     */
    getContactsCount(outbreakId: string,
                     queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<any> {
        const filter = queryBuilder.buildQuery();
        return this.http.get(`outbreaks/${outbreakId}/contacts/filtered-count?filter=${filter}`);
    }

    /**
     * Delete an existing Contact of contact of an Outbreak
     * @param {string} outbreakId
     * @param {string} contactId
     * @returns {Observable<any>}
     */
    deleteContact(outbreakId: string, contactId: string): Observable<any> {
        return this.http.delete(`outbreaks/${outbreakId}/contacts/${contactId}`);
    }

    /**
     * Add a new Contact of contact for an Outbreak
     * @param {string} outbreakId
     * @param contactData
     * @returns {Observable<any>}
     */
    createContact(outbreakId: string, contactData): Observable<any> {
        return this.http.post(`outbreaks/${outbreakId}/contacts`, contactData);
    }

    /**
     * Retrieve a Contact of contact of an Outbreak
     * @param {string} outbreakId
     * @param {string} contactId
     * @param {boolean} retrieveCreatedUpdatedBy
     * @returns {Observable<ContactOfContactModel>}
     */
    getContact(outbreakId: string,
               contactId: string,
               retrieveCreatedUpdatedBy?: boolean): Observable<ContactOfContactModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/contacts/${contactId}${retrieveCreatedUpdatedBy ? '?retrieveCreatedUpdatedBy=1' : ''}`),
            ContactOfContactModel
        );
    }

    /**
     * Retrieve Contact of contact movement information
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
     * Find contact of contact duplicates
     * @param outbreakId
     * @param contactData
     */
    findDuplicates(outbreakId: string,
                   contactData: any,
                   queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<EntityDuplicatesModel> {
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
     * Modify an existing Contact of contact of an Outbreak
     * @param {string} outbreakId
     * @param {string} contactId
     * @param contactData
     * @param {boolean} retrieveCreatedUpdatedBy
     * @returns {Observable<ContactOfContactModel>}
     */
    modifyContact(outbreakId: string,
                  contactId: string,
                  contactData,
                  retrieveCreatedUpdatedBy?: boolean): Observable<ContactOfContactModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.put(`outbreaks/${outbreakId}/contacts/${contactId}${retrieveCreatedUpdatedBy ? '?retrieveCreatedUpdatedBy=1' : ''}`, contactData),
            ContactOfContactModel
        );
    }

    /**
     * Add multiple Contacts of contacts for a contact
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
     * Modify multiple contacts of contacts
     */
    bulkModifyContacts(outbreakId: string,
                       contactsData: any) {
        return this.http.put(
            `outbreaks/${outbreakId}/contacts/bulk`,
            contactsData
        );
    }

    /**
     * Retrieve the list of contacts of contacts grouped by the risk level
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
     * Restore a contact of contact that was deleted
     * @param {string} outbreakId
     * @param {string} contactId
     * @returns {Observable<Object>}
     */
    restoreContact(outbreakId: string, contactId: string): Observable<any> {
        return this.http.post(`/outbreaks/${outbreakId}/contacts/${contactId}/restore`, {});
    }

    /**
     * Convert a contact of contact to case
     * @param {string} outbreakId
     * @param {string} contactId
     * @returns {Observable<any>}
     */
    convertContactToCase(outbreakId: string, contactId: string): Observable<any> {
        return this.http.post(`outbreaks/${outbreakId}/contacts/${contactId}/convert-to-case`, {});
    }

    /**
     * Generate Contact of contact Visual ID
     * @param outbreakId
     * @param visualIdMask
     * @param personId Optional
     */
    generateContactVisualID(outbreakId: string,
                            visualIdMask: string,
                            personId?: string): Observable<string | VisualIdErrorModel> {
        return this.http
            .post(
                `outbreaks/${outbreakId}/contacts/generate-visual-id`,
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
     * @param outbreakId
     * @param visualIdRealMask
     * @param visualIdMask
     * @param personId Optional
     */
    checkContactVisualIDValidity(outbreakId: string,
                                 visualIdRealMask: string,
                                 visualIdMask: string,
                                 personId?: string): Observable<boolean | IGeneralAsyncValidatorResponse> {
        return this.generateContactVisualID(
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
}
