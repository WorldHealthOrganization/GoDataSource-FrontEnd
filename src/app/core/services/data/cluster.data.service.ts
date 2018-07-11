import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { RequestQueryBuilder } from '../helper/request-query-builder';
import { ClusterModel } from '../../models/cluster.model';

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

