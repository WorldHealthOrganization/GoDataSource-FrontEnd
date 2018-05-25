import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ObservableHelperService } from '../helper/observable-helper.service';

import 'rxjs/add/operator/map';
import { OutbreakModel } from '../../models/outbreak.model';
import { UserRoleModel } from '../../models/user-role.model';
import { StorageKey, StorageService } from '../helper/storage.service';


@Injectable()
export class OutbreakDataService {

    // an Outbreak is active across the application
    activeOutbreak: OutbreakModel;

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
     * Get the outfit that is Active across the application
     * @returns {OutbreakModel}
     */
    getActiveOutbreak(): Observable<OutbreakModel> {
        // get the Active Outbreak from cache
        if (this.activeOutbreak) {
            return Observable.of(this.activeOutbreak);
        }

        // get the Active Outbreak from local storage
        const activeOutbreakFromStorage = <OutbreakModel>this.storageService.get(StorageKey.ACTIVE_OUTBREAK);
        if (activeOutbreakFromStorage) {
            // cache the Active Outbreak
            this.activeOutbreak = activeOutbreakFromStorage;
            // ...and return it
            return Observable.of(this.activeOutbreak);
        }

        // get the first Outbreak from the Outbreaks list
        return this.getOutbreaksList()
            .map((outbreaksList) => {
                if (outbreaksList.length > 0) {
                    // get the first outbreak
                    const activeOutbreak = <OutbreakModel>outbreaksList[0];

                    // cache the outbreak
                    this.activeOutbreak = activeOutbreak;

                    // set the outbreak in local storage
                    this.storageService.set(StorageKey.ACTIVE_OUTBREAK, activeOutbreak);

                    // ...and return it
                    return activeOutbreak;
                } else {
                    return null;
                }
            });
    }

    setActiveOutbreak() {

    }

}

