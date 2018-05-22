import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/map';
import {OutbreakModel} from "../../models/outbreak.model";


@Injectable()
export class OutbreakDataService {

    constructor(
        private http: HttpClient
    ) {
    }

    getOutbreak(outbreakId) {

        return this.http.get(`outbreaks/${outbreakId}`);
    }

    getOutbreaks(){
        return this.http.get(`outbreaks`);
    }

    create(outbreak): Observable<any> {
        outbreak.caseClassification = {};
        outbreak.caseInvestigationTemplate = {};
        outbreak.contactFollowUpTemplate = {};
        outbreak.labResultsTemplate = {};
        outbreak.nutritionalStatus = {};
        outbreak.pregnancyInformation = {};
        outbreak. vaccinationStatus = {};

        return this.http.post(`outbreaks`, outbreak)
            .do((res) => {
                // TODO : handle response
            });
    }

    edit(outbreak): Observable<any> {
        outbreak.caseClassification = {};
        outbreak.caseInvestigationTemplate = {};
        outbreak.contactFollowUpTemplate = {};
        outbreak.labResultsTemplate = {};
        outbreak.nutritionalStatus = {};
        outbreak.pregnancyInformation = {};
        outbreak.vaccinationStatus = {};

        return this.http.put(`outbreaks/${outbreak.id}`, outbreak)
            .do((res) => {
                // TODO : handle response
            });
    }

    delete(outbreakId): Observable<any> {
        return this.http.delete(`outbreaks/${outbreakId}`);
    }

}

