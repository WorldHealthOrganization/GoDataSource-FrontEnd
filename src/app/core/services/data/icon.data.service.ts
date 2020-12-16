import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { IconModel } from '../../models/icon.model';
import { IBasicCount } from '../../models/basic-count.interface';

@Injectable()
export class IconDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {}

    /**
     * Retrieve the list of Icons
     * @returns {Observable<IconModel[]>}
     */
    getIconsList(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<IconModel[]> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`icons?filter=${filter}`),
            IconModel
        );
    }

    /**
     * Retrieve the total number of Icons
     * @returns {Observable<IBasicCount>}
     */
    getIconsCount(
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<IBasicCount> {
        const whereFilter = queryBuilder.filter.generateCondition(true);
        return this.http.get(`icons/count?where=${whereFilter}`);
    }

    /**
     * Delete icon
     * @param {string} iconId
     * @returns {Observable<any>}
     */
    deleteIcon(iconId: string): Observable<any> {
        return this.http.delete(`icons/${iconId}`);
    }
}

