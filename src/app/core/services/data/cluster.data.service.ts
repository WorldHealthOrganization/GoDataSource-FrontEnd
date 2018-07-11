import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { ClusterModel } from '../../models/cluster.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';

@Injectable()
export class ClusterDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {
    }

    /**
     * Retrieve the list of Clusters for an Outbreak
     * @param {string} outbreakId
     * @returns {Observable<ClusterModel[]>}
     */
    getClusterList(outbreakId: string, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<ClusterModel[]> {

        const filter = queryBuilder.buildQuery();

        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/clusters?filter=${filter}`),
            ClusterModel
        );
    }
}

