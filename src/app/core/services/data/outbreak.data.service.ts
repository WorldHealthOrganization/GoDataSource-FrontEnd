import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/takeUntil';
import { OutbreakModel } from '../../models/outbreak.model';
import { UserRoleModel } from '../../models/user-role.model';
import { StorageKey, StorageService } from '../helper/storage.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { AuthDataService } from './auth.data.service';
import { Subject } from 'rxjs/Subject';
import { SnackbarService } from '../helper/snackbar.service';
import { EntityModel } from '../../models/entity.model';
import { CaseModel } from '../../models/case.model';
import { ContactModel } from '../../models/contact.model';
import { EventModel } from '../../models/event.model';
import * as _ from 'lodash';
import { VisualIdErrorModel, VisualIdErrorModelCode } from '../../models/visual-id-error.model';
import 'rxjs/add/observable/throw';

@Injectable()
export class OutbreakDataService {

    // hold the selected (current) Outbreak and emit it on demand
    selectedOutbreakSubject: BehaviorSubject<OutbreakModel> = new BehaviorSubject<OutbreakModel>(null);

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService,
        private storageService: StorageService,
        private snackbarService: SnackbarService,
        private authDataService: AuthDataService
    ) {
    }

    /**
     * Retrieve the list of Outbreaks
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<OutbreakModel[]>}
     */
    getOutbreaksList(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<OutbreakModel[]> {

        const filter = queryBuilder.buildQuery();

        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks?filter=${filter}`),
            OutbreakModel
        );
    }

    /**
     * Delete an existing Outbreak
     * @param {string} outbreakId
     * @returns {Observable<any>}
     */
    deleteOutbreak(outbreakId: string): Observable<any> {
        return this.http.delete(`outbreaks/${outbreakId}`)
            .mergeMap((res) => {
                // re-determine the selected Outbreak
                return this.determineSelectedOutbreak()
                    .map(() => {
                        // preserve the output of the main request
                        return res;
                    });
            });
    }

    /**
     * Create a new Outbreak
     * @param {OutbreakModle} outbreak
     * @returns {Observable<UserRoleModel[]>}
     */
    createOutbreak(outbreak: OutbreakModel): Observable<any> {
        return this.http.post('outbreaks', outbreak)
            .mergeMap((res) => {
                // re-determine the selected Outbreak
                return this.determineSelectedOutbreak()
                    .map(() => {
                        // preserve the output of the main request
                        return res;
                    });
            });
    }

    /**
     * Retrieve an Outbreak
     * @param {string} outbreakId
     * @returns {Observable<OutbreakModel>}
     */
    getOutbreak(outbreakId: string): Observable<OutbreakModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}`),
            OutbreakModel
        );
    }

    /**
     * Modify an existing Outbreak
     * @param {string} outbreakId
     * @returns {Observable<any>}
     */
    modifyOutbreak(outbreakId: string, data: any): Observable<any> {
        return this.http.patch(`outbreaks/${outbreakId}`, data)
            .mergeMap((res) => {
                // re-determine the selected Outbreak
                return this.determineSelectedOutbreak()
                    .map(() => {
                        // preserve the output of the main request
                        return res;
                    });
            });
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
        return Observable.create((observer) => {

            const selectedOutbreakCompleted$ = new Subject();
            // subscribe to the Subject stream
            this.getSelectedOutbreakSubject()
                .takeUntil(selectedOutbreakCompleted$)
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
                .catch(() => {
                    // Outbreak not found; clean it up from local storage since it's outdated
                    this.storageService.remove(StorageKey.SELECTED_OUTBREAK_ID);

                    // ...and re-run the routine
                    return this.determineSelectedOutbreak();
                })
                .do((selectedOutbreak) => {
                    // cache the selected Outbreak
                    this.setSelectedOutbreak(selectedOutbreak);
                });
        }

        // check if the authenticated user has an Active Outbreak
        const authUser = this.authDataService.getAuthenticatedUser();
        if (authUser.activeOutbreakId) {
            return this.getOutbreak(authUser.activeOutbreakId)
                .do((activeOutbreak) => {
                    // cache the selected Outbreak
                    this.setSelectedOutbreak(activeOutbreak);
                });
        }

        // by default, use the first Outbreak in list
        const qb = new RequestQueryBuilder();
        qb.limit(1);
        return this.getOutbreaksList(qb)
            .map((outbreaks: OutbreakModel[]) => {
                if (outbreaks.length > 0) {
                    // cache the selected Outbreak
                    this.setSelectedOutbreak(outbreaks[0]);

                    return outbreaks[0];
                }

                // there is no Outbreak in the system
                return new OutbreakModel();
            });
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
     *  Check if the active outbreak for the logged in user is the same as the selected one and display message if not
     */
    checkActiveSelectedOutbreak() {
        this.getSelectedOutbreak()
            .subscribe((selectedOutbreak) => {
                const authUser = this.authDataService.getAuthenticatedUser();
                if (!authUser.activeOutbreakId) {
                    this.snackbarService.showNotice('LNG_GENERIC_WARNING_NO_ACTIVE_OUTBREAK');
                } else {
                    if (authUser.activeOutbreakId !== selectedOutbreak.id) {
                        this.getOutbreak(authUser.activeOutbreakId)
                            .subscribe((outbreak) => {
                                this.snackbarService.showNotice(
                                    'LNG_GENERIC_WARNING_SELECTED_OUTBREAK_NOT_ACTIVE',
                                    {
                                        activeOutbreakName: outbreak.name,
                                        selectedOutbreakName: selectedOutbreak.name
                                    }
                                );
                            });
                    } else {
                        this.snackbarService.dismissAll();
                    }
                }
            });
    }

    /**
     * Get people inconsistencies
     * @param outbreakId
     */
    getPeopleInconsistencies(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<(CaseModel | ContactModel | EventModel)[]> {
        const filter = queryBuilder.buildQuery();
        return this.http.get(`outbreaks/${outbreakId}/people/inconsistencies-in-key-dates?filter=${filter}`)
            .map((peopleList) => {
                return _.map(peopleList, (entity) => {
                    return new EntityModel(entity).model;
                });
            });
    }

    /**
     * Generate Visual ID
     * @param outbreakId
     * @param visualIdMask
     * @param personId Optional
     */
    generateVisualID(
        outbreakId: string,
        visualIdMask: string,
        personId?: string
    ): Observable<string | VisualIdErrorModel> {
        return this.http
            .post(
                `outbreaks/${outbreakId}/generate-visual-id`,
                {
                    visualIdMask: visualIdMask,
                    personId: personId
                }
            ).catch((response: Error | VisualIdErrorModel) => {
                return (response as VisualIdErrorModel).code === VisualIdErrorModelCode.INVALID_VISUAL_ID_MASK ?
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
     * @param visualIdMask
     * @param personId Optional
     */
    generateVisualIDCheckValidity(
        outbreakId: string,
        visualIdMask: string,
        personId?: string
    ): Observable<boolean> {
        return this.generateVisualID(
            outbreakId,
            visualIdMask,
            personId
        ).map((visualID: string | VisualIdErrorModel) => {
            return _.isString(visualID);
        });
    }
}

