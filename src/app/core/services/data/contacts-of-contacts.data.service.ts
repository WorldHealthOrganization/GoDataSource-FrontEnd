import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { HttpClient } from '@angular/common/http';
import { ModelHelperService } from '../helper/model-helper.service';
import { ContactOfContactModel } from '../../models/contact-of-contact.model';
import { AddressModel } from '../../models/address.model';
import { EntityDuplicatesModel } from '../../models/entity-duplicates.model';
import { RiskLevelGroupModel } from '../../models/risk-level-group.model';
import { catchError, map } from 'rxjs/internal/operators';
import { VisualIdErrorModel, VisualIdErrorModelCode } from '../../models/visual-id-error.model';
import { IGeneralAsyncValidatorResponse } from '../../../shared/xt-forms/validators/general-async-validator.directive';
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
    getContactsOfContactsList(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<ContactOfContactModel[]> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/contacts-of-contacts?filter=${filter}`),
            ContactOfContactModel
        );
    }

    /**
     * Return total number of contacts of contacts
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<any>}
     */
    getContactsOfContactsCount(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<any> {
        const filter = queryBuilder.buildQuery();
        return this.http.get(`outbreaks/${outbreakId}/contacts-of-contacts/filtered-count?filter=${filter}`);
    }

    /**
     * Delete an existing Contact of contact of an Outbreak
     * @param {string} outbreakId
     * @param {string} contactOfContactId
     * @returns {Observable<any>}
     */
    deleteContactOfContact(outbreakId: string, contactOfContactId: string): Observable<any> {
        return this.http.delete(`outbreaks/${outbreakId}/contacts-of-contacts/${contactOfContactId}`);
    }

    /**
     * Add a new Contact of contact for an Outbreak
     * @param {string} outbreakId
     * @param contactOfContactData
     * @returns {Observable<any>}
     */
    createContactOfContact(outbreakId: string, contactOfContactData): Observable<any> {
        return this.http.post(`outbreaks/${outbreakId}/contacts-of-contacts`, contactOfContactData);
    }

    /**
     * Retrieve a Contact of contact of an Outbreak
     * @param {string} outbreakId
     * @param {string} contactOfContactId
     * @param {boolean} retrieveCreatedUpdatedBy
     * @returns {Observable<ContactOfContactModel>}
     */
    getContactOfContact(
        outbreakId: string,
        contactOfContactId: string,
        retrieveCreatedUpdatedBy?: boolean
    ): Observable<ContactOfContactModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/contacts-of-contacts/${contactOfContactId}${retrieveCreatedUpdatedBy ? '?retrieveCreatedUpdatedBy=1' : ''}`),
            ContactOfContactModel
        );
    }

    /**
     * Retrieve Contact of contact movement information
     * @param {string} outbreakId
     * @param {string} contactOfContactId
     * @returns {Observable<AddressModel[]>}
     */
    getContactOfContactMovement(
        outbreakId: string,
        contactOfContactId: string
    ): Observable<AddressModel[]> {
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/contacts-of-contacts/${contactOfContactId}/movement`),
            AddressModel
        );
    }

    /**
     * Find contact of contact duplicates
     * @param outbreakId
     * @param contactOfContactData
     */
    findDuplicates(outbreakId: string,
                   contactOfContactData: any,
                   queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<EntityDuplicatesModel> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableToModel(
            this.http.post(
                `outbreaks/${outbreakId}/contacts-of-contacts/duplicates/find?filter=${filter}`,
                contactOfContactData
            ),
            EntityDuplicatesModel
        );
    }

    /**
     * Modify an existing Contact of contact of an Outbreak
     * @param {string} outbreakId
     * @param {string} contactOfContactId
     * @param contactOfContactData
     * @param {boolean} retrieveCreatedUpdatedBy
     * @returns {Observable<ContactOfContactModel>}
     */
    modifyContactOfContact(outbreakId: string,
                  contactOfContactId: string,
                  contactOfContactData,
                  retrieveCreatedUpdatedBy?: boolean
    ): Observable<ContactOfContactModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.put(`outbreaks/${outbreakId}/contacts-of-contacts/${contactOfContactId}${retrieveCreatedUpdatedBy ? '?retrieveCreatedUpdatedBy=1' : ''}`, contactOfContactData),
            ContactOfContactModel
        );
    }

    /**
     * Modify multiple contacts of contacts
     */
    bulkModifyContactsOfContacts(
        outbreakId: string,
        contactsData: any) {
        return this.http.put(
            `outbreaks/${outbreakId}/contacts-of-contacts/bulk `,
            contactsData
        );
    }

    /**
     * Retrieve the list of contacts of contacts grouped by the risk level
     * @param {string} outbreakId
     * @returns {Observable<RiskLevelGroupModel>}
     */
    getContactsOfContactsGroupedByRiskLevel(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<RiskLevelGroupModel> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/contacts-of-contacts/per-risk-level/count?filter=${filter}`),
            RiskLevelGroupModel
        );
    }

    /**
     * Restore a contact of contact that was deleted
     * @param {string} outbreakId
     * @param {string} contactOfContactId
     * @returns {Observable<Object>}
     */
    restoreContactOfContact(outbreakId: string, contactOfContactId: string): Observable<any> {
        return this.http.post(`/outbreaks/${outbreakId}/contacts-of-contacts/${contactOfContactId}/restore`, {});
    }

    /**
     * Generate Contact of contact Visual ID
     * @param outbreakId
     * @param visualIdMask
     * @param personId Optional
     */
    generateContactOfContactVisualID(
        outbreakId: string,
        visualIdMask: string,
        personId?: string
    ): Observable<string | VisualIdErrorModel> {
        return this.http
            .post(
                `outbreaks/${outbreakId}/contacts-of-contacts/generate-visual-id`,
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
    checkContactOfContactVisualIDValidity(
        outbreakId: string,
        visualIdRealMask: string,
        visualIdMask: string,
        personId?: string
    ): Observable<boolean | IGeneralAsyncValidatorResponse> {
        return this.generateContactOfContactVisualID(
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
