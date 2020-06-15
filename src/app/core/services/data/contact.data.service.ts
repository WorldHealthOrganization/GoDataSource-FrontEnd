
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ModelHelperService } from '../helper/model-helper.service';
import { ContactModel } from '../../models/contact.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { MetricContactsSeenEachDays } from '../../models/metrics/metric-contacts-seen-each-days.model';
import { AddressModel } from '../../models/address.model';
import { RiskLevelGroupModel } from '../../models/risk-level-group.model';
import { EntityModel } from '../../models/entity-and-relationship.model';
import { EntityType } from '../../models/entity-type';
import { EntityDuplicatesModel } from '../../models/entity-duplicates.model';
import { VisualIdErrorModel, VisualIdErrorModelCode } from '../../models/visual-id-error.model';
import * as _ from 'lodash';
import { IGeneralAsyncValidatorResponse } from '../../../shared/xt-forms/validators/general-async-validator.directive';
import { MetricContactsFollowedUpReportModel } from '../../models/metrics/metric-contacts-followed-up-report.model';
import { catchError, map } from 'rxjs/operators';
import { Observable, throwError, of } from 'rxjs';
import { IBasicCount } from '../../models/basic-count.interface';

@Injectable()
export class ContactDataService {
    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {}

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
     * @returns {Observable<IBasicCount>}
     */
    getContactsCount(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<IBasicCount> {
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
     * @param {boolean} retrieveCreatedUpdatedBy
     * @returns {Observable<ContactModel>}
     */
    getContact(
        outbreakId: string,
        contactId: string,
        retrieveCreatedUpdatedBy?: boolean
    ): Observable<ContactModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/contacts/${contactId}${retrieveCreatedUpdatedBy ? '?retrieveCreatedUpdatedBy=1' : ''}`),
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
     * @param {boolean} retrieveCreatedUpdatedBy
     * @returns {Observable<ContactModel>}
     */
    modifyContact(
        outbreakId: string,
        contactId: string,
        contactData,
        retrieveCreatedUpdatedBy?: boolean
    ): Observable<ContactModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.put(`outbreaks/${outbreakId}/contacts/${contactId}${retrieveCreatedUpdatedBy ? '?retrieveCreatedUpdatedBy=1' : ''}`, contactData),
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
     * Modify multiple contacts
     */
    bulkModifyContacts(
        outbreakId: string,
        contactsData: any
    ) {
        return this.http.put(
            `outbreaks/${outbreakId}/contacts/bulk`,
            contactsData
        );
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

    /**
     * Contacts followed up report
     * @param {string} outbreakId
     * @param reportData
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<MetricContactsFollowedUpReportModel[]>}
     */
    getContactsFollowedUpReport(
        outbreakId: string,
        reportData: any,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<MetricContactsFollowedUpReportModel[]> {
        const filter = queryBuilder.buildQuery();
        const obs = this.http.post(`outbreaks/${outbreakId}/contacts/follow-up-report?filter=${filter}`, reportData);
        return obs
            .pipe(
                map(
                    (listResult: any) => {
                        const results: MetricContactsFollowedUpReportModel[] = [];
                        // if we don't have contacts to show chart creation is breaking so return
                        if (listResult.report.totalContacts < 1) {
                            return results;
                        }

                        const listReport: any = listResult.report;
                        if (listReport.days) {
                            Object.keys(listReport.days).forEach((key) => {
                                const metricResult: any = listReport.days[key];
                                metricResult.day = key;
                                results.push(metricResult);
                            });
                        }
                        return results;
                    }
                )
            );
    }

    /**
     * Get contact relationships count
     * @param {string} outbreakId
     * @param {string} contactId
     */
    getContactRelationshipsCount(outbreakId: string, contactId: string): Observable<any> {
        return this.http.get(`outbreaks/${outbreakId}/contacts/${contactId}/relationships/filtered-count`);
    }
}

