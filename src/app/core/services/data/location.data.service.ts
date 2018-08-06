import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { LocationModel } from '../../models/location.model';
import { CacheKey, CacheService } from '../helper/cache.service';
import 'rxjs/add/operator/share';
import * as _ from 'lodash';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { HierarchicalLocationModel } from '../../models/hierarchical-location.model';

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
    getLocationsList(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<LocationModel[]> {
        // do we need to sort / filter by something? - in this case we don't need to use the cache
        if (queryBuilder.isEmpty()) {
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
        } else {
            const filter = queryBuilder.buildQuery();
            return this.modelHelper.mapObservableListToModel(
                this.http.get(`locations?filter=${filter}`),
                LocationModel
            );
        }
    }

    /**
     * Get all locations that belong to a specific parent ( for top items, parentId can be empty ). Default behavior is to bring only the top records without a parent.
     * @param parentId
     */
    getLocationsListByParent(parentId: string = null, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<LocationModel[]> {
        // define parent condition
        const parentCondition = {
            parentLocationId: {
                eq: parentId
            }
        };

        // include contact in response
        const qb = new RequestQueryBuilder();
        qb.merge(queryBuilder);

        // remove condition
        qb.filter.removeCondition(parentCondition);

        // are we using the cache or sending a request further ?
        if (qb.isEmpty()) {
            // retrieve locations from cache
            return this.getLocationsList(qb).map((locations: LocationModel[]) =>
                _.filter(locations, (location: LocationModel) => {
                    return _.isEmpty(parentId) ?
                        _.isEmpty(location.parentLocationId) :
                        location.parentLocationId === parentId
                        ;
                })
            );
        } else {
            // filter / sort locations on server
            qb.filter.where(parentCondition, true);
            return this.getLocationsList(qb);
        }
    }

    /**
     * Retrieve the Hierarchical list of Locations
     * @returns {Observable<HierarchicalLocationModel[]>}
     */
    getLocationsHierarchicalList(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<HierarchicalLocationModel[]> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`locations/hierarchical?filter=${filter}`),
            HierarchicalLocationModel
        );
    }
}

