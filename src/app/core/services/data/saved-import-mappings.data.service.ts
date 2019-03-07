import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder/request-query-builder';
import { Observable } from 'rxjs/Observable';
import { SavedImportMappingModel } from '../../models/saved-import-mappings.model';
import { ModelHelperService } from '../helper/model-helper.service';


@Injectable()
export class SavedImportMappingService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {

    }

    /**
     * Retrieve the list of saved import mapping
     * @returns {Observable<SavedImportMappingModel[]>}
     */
    getSavedImportMappingsList(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<SavedImportMappingModel[]> {
        const filter = queryBuilder.buildQuery();

        return this.modelHelper.mapObservableListToModel(
            this.http.get(`import-mappings?filter=${filter}`),
            SavedImportMappingModel
        );
    }

    /**
     * Return total number of saved import mappings
     * @param queryBuilder
     * @returns {Observable<Object>}
     */
    getSavedImportMappingsListCount(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<any> {
        const whereFilter = queryBuilder.filter.generateCondition(true);

        return this.http.get(`import-mappings/count?where=${whereFilter}`, {});
    }


    /**
     * Save an import mapping options
     * @param importMappingData
     * @returns {Observable<Object>}
     */
    saveImportMapping(importMappingData: SavedImportMappingModel) {
        return this.http.post(`import-mappings`, importMappingData);
    }

    /**
     * Modify a saved import mapping
     * @param savedImportMappingId
     * @param savedImportMappingData
     * @returns {Observable<any>}
     */
    modifySavedImportMapping(savedImportMappingId: string, savedImportMappingData): Observable<any> {
        return this.modelHelper.mapObservableToModel(
            this.http.put(`import-mappings/${savedImportMappingId}`, savedImportMappingData),
            SavedImportMappingModel
        );
    }

    /**
     * Delete a saved import mapping
     * @param savedImportMappingId
     * @returns {Observable<Object>}
     */
    deleteSavedImportMapping(savedImportMappingId: string) {
        return this.http.delete(`import-mappings/${savedImportMappingId}`);
    }

}
