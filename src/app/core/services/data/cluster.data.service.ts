import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { ClusterModel } from '../../models/cluster.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { CaseModel } from '../../models/case.model';
import { EventModel } from '../../models/event.model';
import { ContactModel } from '../../models/contact.model';
import { EntityModel } from '../../models/entity-and-relationship.model';
import * as _ from 'lodash';
import { LabelValuePair } from '../../models/label-value-pair';
import { map } from 'rxjs/operators';
import { IBasicCount } from '../../models/basic-count.interface';

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
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<ClusterModel[]>}
     */
    getClusterList(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<ClusterModel[]> {

        const filter = queryBuilder.buildQuery();

        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/clusters?filter=${filter}`),
            ClusterModel
        );
    }

    /**
     * Get the clusters as labelValue pairs for side filters
     * @param {string} outbreakId
     * @returns {LabelValuePair[]}
     */
    getClusterListAsLabelValue(outbreakId: string): Observable<LabelValuePair[]> {
        return this.getClusterList(outbreakId)
            .pipe(
                map((clusters) => {
                    return _.map(clusters, (cluster: ClusterModel) => {
                        return new LabelValuePair(cluster.name, cluster.id);
                    });
                })
            );
    }

    /**
     * Return total number of clusters for an Outbreak
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<IBasicCount>}
     */
    getClustersCount(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<IBasicCount> {

        const whereFilter = queryBuilder.filter.generateCondition(true);

        return this.http.get(`outbreaks/${outbreakId}/clusters/count?where=${whereFilter}`);
    }

    /**
     * Retrieve a Cluster of an Outbreak
     * @param {string} outbreakId
     * @param {string} clusterId
     * @returns {Observable<ClusterModel>}
     */
    getCluster(outbreakId: string, clusterId: string): Observable<ClusterModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/clusters/${clusterId}`),
            ClusterModel
        );
    }

    /**
     * Add a new Cluster for an Outbreak
     * @param {string} outbreakId
     * @param clusterData
     * @returns {Observable<any>}
     */
    createCluster(outbreakId: string, clusterData): Observable<any> {
        return this.http.post(`outbreaks/${outbreakId}/clusters`, clusterData);
    }

    /**
     * Modify an existing Cluster of an Outbreak
     * @param {string} outbreakId
     * @param {string} clusterId
     * @param clusterData
     * @returns {Observable<ClusterModel>}
     */
    modifyCluster(outbreakId: string, clusterId: string, clusterData): Observable<ClusterModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.put(`outbreaks/${outbreakId}/clusters/${clusterId}`, clusterData),
            ClusterModel
        );
    }

    /**
     * Delete an existing Cluster of an Outbreak
     * @param {string} outbreakId
     * @param {string} clusterId
     * @returns {Observable<any>}
     */
    deleteCluster(outbreakId: string, clusterId: string): Observable<any> {
        return this.http.delete(`outbreaks/${outbreakId}/clusters/${clusterId}`);
    }

    /**
     * Get people for specific cluster
     * @param {string} outbreakId
     * @param {string} clusterId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<(CaseModel | ContactModel | EventModel)[]>}
     */
    getClusterPeople(
        outbreakId: string,
        clusterId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<(CaseModel | ContactModel | EventModel)[]> {

        const qb = new RequestQueryBuilder();
        // include relation for Events
        qb.include('location', true);
        // include relation for Cases / Contacts
        qb.include('locations', true);

        qb.merge(queryBuilder);

        const filter = qb.buildQuery();

        return this.http.get(`/outbreaks/${outbreakId}/clusters/${clusterId}/people?filter=${filter}`)
            .pipe(
                map((peopleList) => {
                    return _.map(peopleList, (entity) => {
                        return new EntityModel(entity).model;
                    });
                })
            );
    }

    /**
     * Return total number of people in a cluster
     * @param {string} outbreakId
     * @param {string} clusterId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<IBasicCount>}
     */
    getClusterPeopleCount(
        outbreakId: string,
        clusterId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<IBasicCount> {

        const whereFilter = queryBuilder.filter.generateCondition(true);

        return this.http.get(`/outbreaks/${outbreakId}/clusters/${clusterId}/people/count?where=${whereFilter}`);
    }
}

