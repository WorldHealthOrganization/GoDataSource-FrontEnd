import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ObservableHelperService } from '../helper/observable-helper.service';
import { LocationModel } from '../../models/location.model';

@Injectable()
export class LocationDataService {

    constructor(
        private http: HttpClient,
        private observableHelper: ObservableHelperService
    ) {
    }

    /**
     * Retrieve the list of Locations
     * @returns {Observable<LocationModel[]>}
     */
    getLocationsList(): Observable<LocationModel[]> {
        return this.observableHelper.mapListToModel(
            this.http.get(`locations`),
            LocationModel
        );
    }
}

