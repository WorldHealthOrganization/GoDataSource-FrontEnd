import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';

import 'rxjs/add/operator/map';
import { OutbreakModel } from '../../models/outbreak.model';
import { UserRoleModel } from '../../models/user-role.model';
import { StorageService } from '../helper/storage.service';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { RequestQueryBuilder } from '../helper/request-query-builder';
import { AuthDataService } from './auth.data.service';
import { Subject } from 'rxjs/Subject';
import { SnackbarService } from "../helper/snackbar.service";


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
        return this.http.delete(`outbreaks/${outbreakId}`);
    }

    /**
     * Create a new Outbreak
     * @param {OutbreakModle} outbreak
     * @returns {Observable<UserRoleModel[]>}
     */
    createOutbreak(outbreak: OutbreakModel): Observable<any> {
        return this.http.post('outbreaks', outbreak);
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
        return this.http.patch(`outbreaks/${outbreakId}`, data);
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
                    this.snackbarService.showNotice(`You don't have an active outbreak set.`);
                } else {
                    if (authUser.activeOutbreakId != selectedOutbreak.id) {
                        this.getOutbreak(authUser.activeOutbreakId)
                            .subscribe((outbreak) => {
                                this.snackbarService.showNotice(`The active outbreak is ${outbreak.name} while the selected one is ${selectedOutbreak.name}.`);
                            });
                    }
                    else {
                        this.snackbarService.dismissAll();
                    }
                }
            });
    }


}

