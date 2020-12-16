import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { EventModel } from '../../models/event.model';
import { IBasicCount } from '../../models/basic-count.interface';
import { ImportResultModel } from '../../models/import-result.model';

@Injectable()
export class ImportResultDataService {
    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {}

    /**
     * Retrieve the list of Import results
     */
    getImportResultsList(
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<EventModel[]> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`import-results?filter=${filter}`),
            ImportResultModel
        );
    }

    /**
     * Return total number of import results
     */
    getImportResultsCount(
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<IBasicCount> {
        const whereFilter = queryBuilder.filter.generateCondition(true);
        return this.http.get(`import-results/count?where=${whereFilter}`);
    }
}
