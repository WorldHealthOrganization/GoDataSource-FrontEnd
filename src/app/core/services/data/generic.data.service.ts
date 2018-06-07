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
}

