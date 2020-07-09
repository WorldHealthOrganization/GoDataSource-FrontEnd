import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { OutbreakModel } from '../../models/outbreak.model';
import { StorageKey, StorageService } from '../helper/storage.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { AuthDataService } from './auth.data.service';
import { SnackbarService } from '../helper/snackbar.service';
import { EntityModel } from '../../models/entity-and-relationship.model';
import { CaseModel } from '../../models/case.model';
import { ContactModel } from '../../models/contact.model';
import { EventModel } from '../../models/event.model';
import * as _ from 'lodash';
import { HierarchicalLocationModel } from '../../models/hierarchical-location.model';
import { PeoplePossibleDuplicateModel } from '../../models/people-possible-duplicate.model';
import { EntityType } from '../../models/entity-type';
import { IGeneralAsyncValidatorResponse } from '../../../shared/xt-forms/validators/general-async-validator.directive';
import { catchError, map, mergeMap, takeUntil, tap } from 'rxjs/operators';
import { IBasicCount } from '../../models/basic-count.interface';
import { ContactOfContactModel } from '../../models/contact-of-contact.model';
import { FilteredRequestCache } from '../../helperClasses/filtered-request-cache';
import { AppMessages } from '../../enums/app-messages.enum';

@Injectable()
export class OutbreakDataService {
    // hold the selected (current) Outbreak and emit it on demand
    selectedOutbreakSubject: BehaviorSubject<OutbreakModel> = new BehaviorSubject<OutbreakModel>(null);

    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService,
        private storageService: StorageService,
        private snackbarService: SnackbarService,
        private authDataService: AuthDataService
    ) {}

    /**
     * Retrieve the list of Outbreaks
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<OutbreakModel[]>}
     */
    getOutbreaksList(
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<OutbreakModel[]> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks?filter=${filter}`),
            OutbreakModel
        );
    }

    /**
     * Retrieve the list of Outbreaks
     * @returns {Observable<OutbreakModel[]>}
     */
    getOutbreaksListReduced(): Observable<OutbreakModel[]> {
        // retrieve only necessary fields
        const qb: RequestQueryBuilder = new RequestQueryBuilder();
        qb.fields(
            'id',
            'name',
            'description'
        );

        // filter
        const filter = qb.buildQuery();
        return FilteredRequestCache.get(
            'getOutbreaksListReduced',
            filter,
            () => {
                return this.modelHelper.mapObservableListToModel(
                    this.http.get(`outbreaks?filter=${filter}`),
                    OutbreakModel
                );
            }
        );
    }

    /**
     * Retrieve the number of Outbreaks
     * @param {RequestQueryBuilder} queryBuilder
     */
    getOutbreaksCount(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<IBasicCount> {
        // build where filter
        const whereFilter = queryBuilder.filter.generateCondition(true);
        return this.http.get(`outbreaks/count?where=${whereFilter}`);
    }

    /**
     * Delete an existing Outbreak
     * @param {string} outbreakId
     * @returns {Observable<any>}
     */
    deleteOutbreak(outbreakId: string): Observable<any> {
        return this.http.delete(`outbreaks/${outbreakId}`)
            .pipe(
                mergeMap((res) => {
                    // re-determine the selected Outbreak
                    return this.determineSelectedOutbreak()
                        .pipe(
                            map(() => {
                                // preserve the output of the main request
                                return res;
                            })
                        );
                })
            );
    }

    /**
     * Restore an outbreak that was deleted
     * @param {string} outbreakId
     * @returns {Observable<any>}
     */
    restoreOutbreak(outbreakId: string): Observable<any> {
        return this.http.post(`outbreaks/${outbreakId}/restore`, {});
    }

    /**
     * Create a new Outbreak
     * @param { OutbreakModel } outbreak
     * @param { string } outbreakTemplateId
     */
    createOutbreak(outbreak: OutbreakModel, outbreakTemplateId?: string): Observable<any> {
        return this.http.post(`outbreaks${outbreakTemplateId ? `?templateId=${outbreakTemplateId}` : '' }`, outbreak)
            .pipe(
                mergeMap((res) => {
                    // re-determine the selected Outbreak
                    return this.determineSelectedOutbreak()
                        .pipe(
                            map(() => {
                                // preserve the output of the main request
                                return res;
                            })
                        );
                })
            );
    }

    /**
     * Retrieve an Outbreak
     * @param {string} outbreakId
     * @param {boolean} retrieveCreatedUpdatedBy
     * @returns {Observable<OutbreakModel>}
     */
    getOutbreak(
        outbreakId: string,
        retrieveCreatedUpdatedBy?: boolean
    ): Observable<OutbreakModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}${retrieveCreatedUpdatedBy ? '?retrieveCreatedUpdatedBy=1' : ''}`),
            OutbreakModel
        );
    }

    /**
     * Modify an existing Outbreak
     * @param {string} outbreakId
     * @param data
     * @param {boolean} retrieveCreatedUpdatedBy
     * @returns {Observable<OutbreakModel>}
     */
    modifyOutbreak(
        outbreakId: string,
        data: any,
        retrieveCreatedUpdatedBy?: boolean
    ): Observable<OutbreakModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.patch(`outbreaks/${outbreakId}${retrieveCreatedUpdatedBy ? '?retrieveCreatedUpdatedBy=1' : ''}`, data)
                .pipe(
                    mergeMap((res) => {
                        // re-determine the selected Outbreak
                        return this.determineSelectedOutbreak()
                            .pipe(
                                map(() => {
                                    // preserve the output of the main request
                                    return res;
                                })
                            );
                    })
                ),
            OutbreakModel
        );
    }

    /**
     * Retrieve the Hierarchical list of Locations
     * @returns {Observable<HierarchicalLocationModel[]>}
     */
    getOutbreakLocationsHierarchicalList(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<HierarchicalLocationModel[]> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/locations/hierarchical?filter=${filter}`),
            HierarchicalLocationModel
        );
    }

    /**
     * Get the selected Outbreak Subject
     * Note: By subscribing to this Subject, the response handler will be executed every time a new value is emitted
     * @returns {BehaviorSubject<OutbreakModel>}
     */
    getSelectedOutbreakSubject(): BehaviorSubject<OutbreakModel> {
        return this.selectedOutbreakSubject;
    }

    /**
     * Get the selected Outbreak
     * @returns {Observable<OutbreakModel>}
     */
    getSelectedOutbreak(): Observable<OutbreakModel> {
        return new Observable((observer) => {

            const selectedOutbreakCompleted$ = new Subject();
            // subscribe to the Subject stream
            this.getSelectedOutbreakSubject()
                .pipe(
                    takeUntil(selectedOutbreakCompleted$)
                )
                .subscribe((outbreak: OutbreakModel | null) => {
                    if (outbreak) {
                        // found the Selected Outbreak
                        observer.next(outbreak);
                        observer.complete();

                        // complete the Subject stream so it will automatically unsubscribe from it
                        selectedOutbreakCompleted$.next();
                        selectedOutbreakCompleted$.complete();
                    }
                });
        });
    }

    /**
     * Get the Outbreak that is Active for the authenticated user
     * Otherwise, use the first outbreak in the list
     * @returns {OutbreakModel}
     */
    determineSelectedOutbreak(): Observable<OutbreakModel> {
        // check if user has selected any Outbreak (get it from local storage)
        const selectedOutbreakId = this.storageService.get(StorageKey.SELECTED_OUTBREAK_ID);
        if (selectedOutbreakId) {
            // retrieve the Outbreak
            return this.getOutbreak(selectedOutbreakId)
                .pipe(
                    catchError(() => {
                        // Outbreak not found; clean it up from local storage since it's outdated
                        this.storageService.remove(StorageKey.SELECTED_OUTBREAK_ID);

                        // ...and re-run the routine
                        return this.determineSelectedOutbreak();
                    }),
                    tap((selectedOutbreak) => {
                        // cache the selected Outbreak
                        this.setSelectedOutbreak(selectedOutbreak);
                    })
                );
        }

        // check if the authenticated user has an Active Outbreak
        const authUser = this.authDataService.getAuthenticatedUser();
        if (authUser.activeOutbreakId) {
            return this.getOutbreak(authUser.activeOutbreakId)
                .pipe(
                    tap((activeOutbreak) => {
                        // cache the selected Outbreak
                        this.setSelectedOutbreak(activeOutbreak);
                    })
                );
        }

        // by default, use the first Outbreak in list
        const qb = new RequestQueryBuilder();
        qb.limit(1);
        return this.getOutbreaksList(qb)
            .pipe(
                map((outbreaks: OutbreakModel[]) => {
                    if (outbreaks.length > 0) {
                        // cache the selected Outbreak
                        this.setSelectedOutbreak(outbreaks[0]);

                        return outbreaks[0];
                    }

                    // there is no Outbreak in the system
                    return new OutbreakModel();
                })
            );
    }

    /**
     * Set the Outbreak to be selected across the application
     * @param {OutbreakModel} outbreak
     */
    setSelectedOutbreak(outbreak: OutbreakModel) {
        // set the new Outbreak ID in local storage
        this.storageService.set(StorageKey.SELECTED_OUTBREAK_ID, outbreak.id);

        // emit the new value
        this.selectedOutbreakSubject.next(outbreak);
    }

    /**
     * Check if the name of the new outbreak is unique
     * @returns {Observable<boolean | IGeneralAsyncValidatorResponse>}
     */
    checkOutbreakNameUniquenessValidity(newOutbreakName: string, outbreakId?: string): Observable<boolean | IGeneralAsyncValidatorResponse> {
        const qb: RequestQueryBuilder = new RequestQueryBuilder();
        qb.filter.byEquality('name', newOutbreakName, true, true);

        // condition for modify outbreak
        if (outbreakId) {
            qb.filter.where({
                'id': {
                    neq: outbreakId
                }
            });
        }

        // check if we have duplicates
        return this.getOutbreaksCount(qb)
            .pipe(
                map((countData: { count: number }) => {
                    return !countData.count ?
                        true : {
                            isValid: false,
                            errMsg: 'LNG_FORM_VALIDATION_ERROR_OUTBREAK_NAME_NOT_UNIQUE'
                        };
                })
            );
    }

    /**
     *  Check if the active outbreak for the logged in user is the same as the selected one and display message if not
     */
    checkActiveSelectedOutbreak() {
        this.getSelectedOutbreak()
            .subscribe((selectedOutbreak) => {
                const authUser = this.authDataService.getAuthenticatedUser();
                if (!authUser.activeOutbreakId) {
                    this.snackbarService.showNotice(
                        'LNG_GENERIC_WARNING_NO_ACTIVE_OUTBREAK',
                        undefined,
                        false,
                        AppMessages.APP_MESSAGE_UNRESPONSIVE_NO_ACTIVE_OUTBREAK
                    );
                } else {
                    // hide message
                    this.snackbarService.hideMessage(AppMessages.APP_MESSAGE_UNRESPONSIVE_NO_ACTIVE_OUTBREAK);

                    // outbreak not active ?
                    if (authUser.activeOutbreakId !== selectedOutbreak.id) {
                        this.getOutbreak(authUser.activeOutbreakId)
                            .subscribe((outbreak) => {
                                this.snackbarService.showNotice(
                                    'LNG_GENERIC_WARNING_SELECTED_OUTBREAK_NOT_ACTIVE',
                                    {
                                        activeOutbreakName: outbreak.name,
                                        selectedOutbreakName: selectedOutbreak.name
                                    },
                                    false,
                                    AppMessages.APP_MESSAGE_UNRESPONSIVE_SELECTED_OUTBREAK_NOT_ACTIVE
                                );
                            });
                    } else {
                        // hide message
                        this.snackbarService.hideMessage(AppMessages.APP_MESSAGE_UNRESPONSIVE_SELECTED_OUTBREAK_NOT_ACTIVE);
                    }
                }
            });
    }

    /**
     * Get people inconsistencies
     * @param outbreakId
     * @param queryBuilder
     */
    getPeopleInconsistencies(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<(CaseModel | ContactModel | EventModel | ContactOfContactModel)[]> {
        const filter = queryBuilder.buildQuery();
        return this.http.get(`outbreaks/${outbreakId}/people/inconsistencies-in-key-dates?filter=${filter}`)
            .pipe(
                map((peopleList) => {
                    return _.map(peopleList, (entity) => {
                        return new EntityModel(entity).model;
                    });
                })
            );
    }

    /**
     * GET outbreak case / contacts & events possible duplicates
     * @param outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<PeoplePossibleDuplicateModel>}
     */
    getPeoplePossibleDuplicates(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<PeoplePossibleDuplicateModel> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/people/possible-duplicates?filter=${filter}`),
            PeoplePossibleDuplicateModel
        );
    }

    /**
     * Return total number of case / contacts & events possible duplicates
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<IBasicCount>}
     */
    getPeoplePossibleDuplicatesCount(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<IBasicCount> {
        const whereFilter = queryBuilder.filter.generateCondition(true);
        return this.http.get(`outbreaks/${outbreakId}/people/possible-duplicates/count?where=${whereFilter}`);
    }

    /**
     * Retrieve records from db
     * @param outbreakId
     * @param queryBuilder
     * @returns {Observable<EntityModel[]>}
     */
    getPeopleList(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<EntityModel[]> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/people?filter=${filter}`),
            EntityModel
        );
    }

    /**
     * Merge people
     * @param outbreakId
     * @param type
     * @param ids
     * @param modelData
     */
    mergePeople(
        outbreakId: string,
        type: EntityType,
        ids: string[],
        modelData: any
    ): Observable<any> {
        return this.http.post(
            `outbreaks/${outbreakId}/merge`, {
                type: type,
                ids: ids,
                model: modelData
            }
        );
    }
}

