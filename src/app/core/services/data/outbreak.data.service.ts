import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ObservableHelperService } from '../helper/observable-helper.service';

import 'rxjs/add/operator/map';
import {OutbreakModel} from "../../models/outbreak.model";
import { UserRoleModel } from "../../models/user-role.model";


@Injectable()
export class OutbreakDataService {

    constructor(
        private http: HttpClient,
        private observableHelper: ObservableHelperService
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

}

