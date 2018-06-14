import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { LocationModel } from '../../models/location.model';

@Injectable()
export class LocationDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {
    }

    /**
     * Retrieve the list of Locations
     * @returns {Observable<LocationModel[]>}
     */
    getLocationsList(): Observable<LocationModel[]> {
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`locations`),
            LocationModel
        );
    }
}

