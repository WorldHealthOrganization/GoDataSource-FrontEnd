import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { LocationModel } from '../../models/location.model';
import { CacheKey, CacheService } from '../helper/cache.service';
import * as _ from 'lodash';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { HierarchicalLocationModel } from '../../models/hierarchical-location.model';
import { LocationUsageModel } from '../../models/location-usage.model';
import { map, share, tap } from 'rxjs/operators';
import { IBasicCount } from '../../models/basic-count.interface';

@Injectable()
export class LocationDataService {

    locationList$: Observable<any>;
    groupedLocations$: Observable<any>;

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService,
        private cacheService: CacheService
    ) {
        this.locationList$ = this.http.get(`locations`).pipe(share());
        this.groupedLocations$ = this.http.get('locations/hierarchical?filter={"order":["name asc"]}').pipe(share());
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
                return of(locationsList);
            } else {
                // get locations list from API
                return this.modelHelper.mapObservableListToModel(
                    this.locationList$,
                    LocationModel
                )
                    .pipe(
                        tap((locations) => {
                            // cache the list
                            this.cacheService.set(CacheKey.LOCATIONS, locations);
                        })
                    );
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
     * @param {string} parentId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<LocationModel[]>}
     */
    getLocationsListByParent(
        parentId: string = null,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<LocationModel[]> {

        // define parent condition
        const parentCondition = {
            parentLocationId: {
                eq: parentId
            }
        };

        // include conditions
        const qb = new RequestQueryBuilder();
        qb.merge(queryBuilder);

        // remove condition on parent
        qb.filter.removeCondition(parentCondition);

        // are we using the cache or sending a request further ?
        if (qb.isEmpty()) {
            // retrieve locations from cache
            return this.getLocationsList(qb)
                .pipe(
                    map((locations: LocationModel[]) =>
                        _.filter(locations, (location: LocationModel) => {
                            return _.isEmpty(parentId) ?
                                _.isEmpty(location.parentLocationId) :
                                location.parentLocationId === parentId
                                ;
                        })
                    )
                );
        } else {
            // filter / sort locations on server
            qb.filter.where(parentCondition, true);
            return this.getLocationsList(qb);
        }
    }

    /**
     * Get the total number of locations that belong to a specific parent
     * Note: For top items, parentId can be empty. Default behavior is to bring only the top records without a parent.
     *
     * @param {string} parentId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<IBasicCount>}
     */
    getLocationsCountByParent(
        parentId: string = null,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<IBasicCount> {

        // define parent condition
        const parentCondition = {
            parentLocationId: {
                eq: parentId
            }
        };

        // include conditions
        const qb = new RequestQueryBuilder();
        qb.merge(queryBuilder);

        // add condition on parent
        qb.filter.where(parentCondition, true);

        const whereFilter = qb.filter.generateCondition(true);

        return this.http.get(`locations/count?where=${whereFilter}`);
    }

    /**
     * Retrieve the Hierarchical list of Locations
     * @returns {Observable<HierarchicalLocationModel[]>}
     */
    getLocationsHierarchicalList(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<HierarchicalLocationModel[]> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            queryBuilder.isEmpty() ?
                this.groupedLocations$ :
                this.http.get(`locations/hierarchical?filter=${filter}`),
            HierarchicalLocationModel
        );
    }

    /**
     * Retrieve the Hierarchical parent list of a specific Location
     * @returns {Observable<HierarchicalLocationModel[]>}
     */
    getHierarchicalParentListOfLocation(locationId: string, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<HierarchicalLocationModel[]> {
        const qb = new RequestQueryBuilder();
        qb.filter.where({
            id: locationId
        }, true).flag(
            'includeChildren',
            false
        );
        qb.merge(queryBuilder);

        // retrieve parent locations
        return this.getLocationsHierarchicalList(qb);
    }

    /**
     * Add a new Location
     * @param locationData
     * @returns {Observable<any>}
     */
    createLocation(locationData: {}): Observable<any> {
        return this.http.post('locations', locationData)
            .pipe(
                tap(() => {
                    // refresh location cache
                    this.cacheService.remove(CacheKey.LOCATIONS);
                })
            );
    }

    /**
     * Retrieve Location
     * @param {string} locationId
     * @param {boolean} retrieveCreatedUpdatedBy
     * @returns {Observable<LocationModel>}
     */
    getLocation(
        locationId: string,
        retrieveCreatedUpdatedBy?: boolean
    ): Observable<LocationModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`locations/${locationId}${retrieveCreatedUpdatedBy ? '?retrieveCreatedUpdatedBy=1' : ''}`),
            LocationModel
        );
    }

    /**
     * Modify Location
     * @param {string} locationId
     * @param locationData
     * @param {boolean} retrieveCreatedUpdatedBy
     * @returns {Observable<LocationModel>}
     */
    modifyLocation(
        locationId: string,
        locationData,
        retrieveCreatedUpdatedBy?: boolean
    ): Observable<LocationModel> {
        return this.modelHelper.mapObservableToModel(
            this.http
                .put(`locations/${locationId}${retrieveCreatedUpdatedBy ? '?retrieveCreatedUpdatedBy=1' : ''}`, locationData)
                .pipe(
                    tap(() => {
                        // refresh location cache
                        this.cacheService.remove(CacheKey.LOCATIONS);
                    })
                ),
            LocationModel
        );
    }

    /**
     * Delete Location
     * @param {string} locationId
     * @returns {Observable<any>}
     */
    deleteLocation(locationId: string): Observable<any> {
        return this.http.delete(`locations/${locationId}`)
            .pipe(
                tap(() => {
                    // refresh location cache
                    this.cacheService.remove(CacheKey.LOCATIONS);
                })
            );
    }

    /**
     * Retrieve location usage
     * @param locationId
     */
    getLocationUsage(locationId: string): Observable<LocationUsageModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`locations/${locationId}/usage`),
            LocationUsageModel
        );
    }

    /**
     * Retrieve location usage count
     * @param {string} locationId
     */
    getLocationUsageCount(locationId: string): Observable<any> {
        return this.http.get(`locations/${locationId}/usage/count`);
    }

    /**
     * Propagate lat/lng to all entities that are using specified location
     * @param {string} locationId
     */
    propagateGeoLocation(locationId: string): Observable<any> {
        return this.http.post(`locations/${locationId}/propagate-geo-location`, {});
    }
}

