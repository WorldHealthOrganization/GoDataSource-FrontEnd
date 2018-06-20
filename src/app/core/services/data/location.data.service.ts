import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { LocationModel } from '../../models/location.model';
import { CacheKey, CacheService } from '../helper/cache.service';
import 'rxjs/add/operator/share';

@Injectable()
export class LocationDataService {

    locationList$: Observable<any>;

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService,
        private cacheService: CacheService
    ) {
        this.locationList$ = this.http.get(`locations`).share();
    }

    /**
     * Retrieve the list of Locations
     * @returns {Observable<LocationModel[]>}
     */
    getLocationsList(): Observable<LocationModel[]> {
        // get locations list from cache
        const locationsList = this.cacheService.get(CacheKey.LOCATIONS);
        if (locationsList) {
            return Observable.of(locationsList);
        } else {
            // get locations list from API
            return this.modelHelper.mapObservableListToModel(
                this.locationList$,
                LocationModel
            ).do((locations) => {
                // cache the list
                this.cacheService.set(CacheKey.LOCATIONS, locations);
            });
        }
    }
}

