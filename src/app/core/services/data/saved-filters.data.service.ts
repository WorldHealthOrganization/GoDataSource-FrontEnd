import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ModelHelperService } from '../helper/model-helper.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder/request-query-builder';
import { Observable } from 'rxjs';
import { SavedFilterModel } from '../../models/saved-filters.model';
import { IBasicCount } from '../../models/basic-count.interface';

@Injectable()
export class SavedFiltersService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {

    }

    /**
     * Retrieve the list of saved filters
     * @returns {Observable<SavedFilterModel[]>}
     */
    getSavedFiltersList(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<SavedFilterModel[]> {
        const filter = queryBuilder.buildQuery();

        return this.modelHelper.mapObservableListToModel(
            this.http.get(`filter-mappings?filter=${filter}`),
            SavedFilterModel
        );
    }

    /**
     * Return total number of saved filters
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<IBasicCount>}
     */
    getSavedFiltersListCount(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<IBasicCount> {
        const whereFilter = queryBuilder.filter.generateCondition(true);

        return this.http.get(`filter-mappings/count?where=${whereFilter}`, {});
    }

    /**
     * Create filter
     * @param filterData
     */
    createFilter(filterData: SavedFilterModel) {
        return this.http.post(`filter-mappings`, filterData);
    }

    /**
     * Modify a saved filter
     * @param {string} savedFilterId
     * @returns {Observable<any>}
     */
    modifyFilter(savedFilterId: string, savedFilterData): Observable<any> {
        return this.modelHelper.mapObservableToModel(
            this.http.put(`filter-mappings/${savedFilterId}`, savedFilterData),
            SavedFilterModel
        );
    }

    /**
     * Delete a saved filter
     * @param {string} savedFilterId
     */
    deleteFilter(savedFilterId: string) {
        return this.http.delete(`filter-mappings/${savedFilterId}`);
    }
}
