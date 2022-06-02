import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { IMapResolverV2, IResolverV2ResponseModel } from './models/resolver-response.model';
import { RequestQueryBuilder, RequestSortDirection } from '../../../helperClasses/request-query-builder';
import { AuthDataService } from '../../data/auth.data.service';
import { ClusterModel } from '../../../models/cluster.model';
import { catchError, map } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { StorageKey, StorageService } from '../../helper/storage.service';
import { ClusterDataService } from '../../data/cluster.data.service';

@Injectable()
export class ClusterDataResolver implements IMapResolverV2<ClusterModel> {
  /**
   * Constructor
   */
  constructor(
    private clusterDataService: ClusterDataService,
    private toastV2Service: ToastV2Service,
    private authDataService: AuthDataService,
    private storageService: StorageService
  ) {}

  /**
   * Retrieve data
   */
  resolve(): Observable<IResolverV2ResponseModel<ClusterModel>> {
    // user doesn't have rights ?
    if (
      !ClusterModel.canList(this.authDataService.getAuthenticatedUser()) ||
      !this.storageService.get(StorageKey.SELECTED_OUTBREAK_ID)
    ) {
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

    // sort them
    qb.sort
      .by('name', RequestSortDirection.ASC);

    return this.clusterDataService
      .getClusterList(
        this.storageService.get(StorageKey.SELECTED_OUTBREAK_ID),
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
}
