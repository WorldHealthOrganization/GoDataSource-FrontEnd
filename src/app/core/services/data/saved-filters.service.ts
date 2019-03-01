import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ModelHelperService } from '../helper/model-helper.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder/request-query-builder';
import { Observable } from 'rxjs/Observable';
import { SavedFilterModel } from '../../models/saved-filters.model';

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
     * Return total number of saved filers
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<Object>}
     */
    getSavedFiltersListCount(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<any> {
        const whereFilter = queryBuilder.filter.generateCondition(true);

        return this.http.get(`filter-mappings/count?where=${whereFilter}`, {});
    }

    /**
     * Save a filter
     * @param filterData
     * @returns {Observable<Object>}
     */
    saveFilter(filterData: SavedFilterModel) {
        return this.http.post(`filter-mappings`, filterData);
    }

    /**
     * Delete a saved filter
     * @param {string} savedFilterId
     */
    deleteSavedFilter(savedFilterId: string) {
        return this.http.delete(`filter-mappings/${savedFilterId}`);
    }
}
