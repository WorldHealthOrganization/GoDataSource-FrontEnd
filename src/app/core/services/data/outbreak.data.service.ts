import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';

import 'rxjs/add/operator/map';
import { OutbreakModel } from '../../models/outbreak.model';
import { UserRoleModel } from '../../models/user-role.model';
import { StorageKey, StorageService } from '../helper/storage.service';

import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { RequestQueryBuilder } from "../helper/request-query-builder";


@Injectable()
export class OutbreakDataService {

    // hold the selected (current) Outbreak and emit it on demand
    selectedOutbreakSubject: BehaviorSubject<OutbreakModel> = new BehaviorSubject<OutbreakModel>(null);

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService,
        private storageService: StorageService
    ) {
        // determine the current Outbreak
        this.determineSelectedOutbreak();
    }

    /**
     * Retrieve the list of Outbreaks
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<OutbreakModel[]>}
     */
    getOutbreaksList(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()) : Observable<OutbreakModel[]> {

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
     * Retrieve the Active Outbreak
     * @returns {Observable<OutbreakModel>}
     */
    getActiveOutbreak(): Observable<OutbreakModel> {
        // filter the active outbreak
        const filter = JSON.stringify({
            where: {
                active: true
            }
        });

        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks?filter=${filter}`)
                .map((outbreaks) => {
                    return _.get(outbreaks, '[0]', null);
                }),
            OutbreakModel
        );
    }

    /**
     * Get the selected Outbreak
     * @returns {BehaviorSubject<OutbreakModel>}
     */
    getSelectedOutbreak(): BehaviorSubject<OutbreakModel> {
        return this.selectedOutbreakSubject;
    }

    /**
     * Get the outbreak that is Selected across the application from local storage
     * If it's not set in local storage, use the Active Outbreak
     * @returns {OutbreakModel}
     */
    private determineSelectedOutbreak(): Observable<OutbreakModel> {
        // get the selected Outbreak from local storage
        const selectedOutbreakFromStorage = <OutbreakModel>this.storageService.get(StorageKey.SELECTED_OUTBREAK);
        if (selectedOutbreakFromStorage) {
            // cache the selected Outbreak
            this.setSelectedOutbreak(selectedOutbreakFromStorage);

            // ...and return it
            return Observable.of(selectedOutbreakFromStorage);
        }

        // by default, use the Active Outbreak
        return this.getActiveOutbreak()
            .do((activeOutbreak) => {
                // cache the selected Outbreak
                this.setSelectedOutbreak(activeOutbreak);
            });
    }

    /**
     * Set the Outbreak to be selected across the application
     * @param {OutbreakModel} outbreak
     */
    setSelectedOutbreak(outbreak: OutbreakModel) {
        // keep the outbreak in local storage;
        this.storageService.set(StorageKey.SELECTED_OUTBREAK, outbreak);

        this.selectedOutbreakSubject.next(outbreak);
    }

}

