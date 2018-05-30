import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ObservableHelperService } from '../helper/observable-helper.service';

import 'rxjs/add/operator/map';
import { OutbreakModel } from '../../models/outbreak.model';
import { UserRoleModel } from '../../models/user-role.model';
import { StorageKey, StorageService } from '../helper/storage.service';

import * as _ from 'lodash';


@Injectable()
export class OutbreakDataService {

    // the Outbreak being selected across the application
    selectedOutbreak: OutbreakModel;

    constructor(
        private http: HttpClient,
        private observableHelper: ObservableHelperService,
        private storageService: StorageService
    ) {
    }

    /**
     * Retrieve the list of Outbreaks
     * @returns {Observable<OutbreakModel[]>}
     */
    getOutbreaksList(): Observable<OutbreakModel[]> {
        return this.observableHelper.mapListToModel(
            this.http.get('outbreaks'),
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
        return this.observableHelper.mapToModel(
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

        return this.observableHelper.mapToModel(
            this.http.get(`outbreaks?filter=${filter}`)
                .map((outbreaks) => {
                    return _.get(outbreaks, '[0]', null);
                }),
            OutbreakModel
        );
    }

    /**
     * Get the outbreak that is Selected across the application
     * @returns {OutbreakModel}
     */
    getSelectedOutbreak(): Observable<OutbreakModel> {
        // get the Selected Outbreak from cache
        if (this.selectedOutbreak) {
            return Observable.of(this.selectedOutbreak);
        }

        // get the selected Outbreak from local storage
        const selectedOutbreakFromStorage = <OutbreakModel>this.storageService.get(StorageKey.SELECTED_OUTBREAK);
        if (selectedOutbreakFromStorage) {
            // cache the selected Outbreak
            this.setSelectedOutbreak(selectedOutbreakFromStorage);

            // ...and return it
            return Observable.of(this.selectedOutbreak);
        }

        // by default, the Active Outbreak is selected
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
        // cache the outbreak
        this.selectedOutbreak = outbreak;

        // keep the outbreak in local storage;
        this.storageService.set(StorageKey.SELECTED_OUTBREAK, outbreak);
    }

}

