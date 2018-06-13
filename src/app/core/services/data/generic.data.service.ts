import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Constants } from '../../models/constants';

@Injectable()
export class GenericDataService {

    /**
     * Retrieve the list of Genders
     * @returns {Observable<any[]>}
     */
    getGendersList(): Observable<any[]> {
        return Observable.of(Object.values(Constants.GENDER));
    }

    /**
     * Retrieve the list of Case Classifications
     * @returns {Observable<any[]>}
     */
    getCaseClassificationsList(): Observable<any[]> {
        return Observable.of(Object.values(Constants.CASE_CLASSIFICATION));
    }

    /**
     * Retrieve the list of Risk Levels for a Case
     * @returns {Observable<any[]>}
     */
    getCaseRiskLevelsList(): Observable<any[]> {
        return Observable.of(Object.values(Constants.CASE_RISK_LEVEL));
    }

    /**
     * Retrieve the list of Document Types
     * @returns {Observable<any[]>}
     */
    getDocumentTypesList(): Observable<any[]> {
        return Observable.of(Object.values(Constants.DOCUMENT_TYPE));
    }

    /**
     * Retrieve the list of Diseases
     * @returns {Observable<any[]>}
     */
    getDiseasesList(): Observable<any[]> {
        return Observable.of(Object.values(Constants.DISEASE));
    }

    /**
     * Retrieve the list of Countries
     * @returns {Observable<any[]>}
     */
    getCountriesList(): Observable<any[]> {
        return Observable.of(Object.values(Constants.COUNTRY));
    }

}

