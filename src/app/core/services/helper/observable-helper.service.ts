import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Injectable()
export class ObservableHelperService {

    /**
     * Transform an observable's response from a list of objects to a list of models
     * @param {Observable<any>} obs
     * @param modelClass The Model Class to be instantiated for each item in the list
     * @returns {Observable<any[]>}
     */
    mapListToModel(obs: Observable<any>, modelClass): Observable<any> {
        return obs.map(
            (listResult) => {
                return listResult.map((item) => {
                    return new modelClass(item);
                });
            }
        );
    }

    /**
     * Transform an observable's response from an object to an instance of a model
     * @param {Observable<any>} obs
     * @param modelClass The Model Class to be instantiated for the retrieved item
     * @returns {Observable<any>}
     */
    mapToModel(obs: Observable<any>, modelClass): Observable<any> {
        return obs.map(
            (itemResult) => {
                return new modelClass(itemResult);
            }
        );
    }
}

