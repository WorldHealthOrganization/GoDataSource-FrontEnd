import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { ClusterModel } from '../../models/cluster.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { CaseModel } from '../../models/case.model';
import { EventModel } from '../../models/event.model';
import { ContactModel } from '../../models/contact.model';
import { EntityModel } from '../../models/entity-and-relationship.model';
import * as _ from 'lodash';
import { catchError, map } from 'rxjs/operators';
import { IBasicCount } from '../../models/basic-count.interface';
import { ContactOfContactModel } from '../../models/contact-of-contact.model';
import { IResolverV2ResponseModel } from '../resolvers/data/models/resolver-response.model';
import { AuthDataService } from './auth.data.service';
import { ToastV2Service } from '../helper/toast-v2.service';

@Injectable()
export class ClusterDataService {
  /**
   * Constructor
   */
  constructor(
    private http: HttpClient,
    private modelHelper: ModelHelperService,
    private authDataService: AuthDataService,
    private toastV2Service: ToastV2Service
  ) {}

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
   * Retrieve data
   */
  getResolveList(
    outbreakId: string
  ): Observable<IResolverV2ResponseModel<ClusterModel>> {
    // user doesn't have rights ?
    if (!ClusterModel.canList(this.authDataService.getAuthenticatedUser())) {
      return of({
        list: [],
        map: {},
        options: []
      });
    }

    // construct query
    const qb = new RequestQueryBuilder();
    qb.fields(
      'id',
      'name'
    );

    // retrieve users
    return this
      .getClusterList(
        outbreakId,
        qb
      )
      .pipe(
        map((data) => {
          // construct map
          const response: IResolverV2ResponseModel<ClusterModel> = {
            list: data,
            map: {},
            options: []
          };
          data.forEach((item) => {
            // map
            response.map[item.id] = item;

            // add option
            response.options.push({
              label: item.name,
              value: item.id,
              data: item
            });
          });

          // finished
          return response;
        }),

        // should be last one
        catchError((err) => {
          // display error
          this.toastV2Service.error(err);

          // send error further
          return throwError(err);
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
  ): Observable<(CaseModel | ContactModel | EventModel | ContactOfContactModel)[]> {

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
    const filter = queryBuilder.buildQuery();
    return this.http.get(`/outbreaks/${outbreakId}/clusters/${clusterId}/people/count?filter=${filter}`);
  }
}

