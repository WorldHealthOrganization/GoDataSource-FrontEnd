import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { IconModel } from '../../models/icon.model';

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
     * Delete icon
     * @param {string} iconId
     * @returns {Observable<any>}
     */
    deleteIcon(iconId: string): Observable<any> {
        return this.http.delete(`icons/${iconId}`);
    }
}

