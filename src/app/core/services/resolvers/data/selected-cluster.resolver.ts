import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { Resolve } from '@angular/router';
import { StorageKey, StorageService } from '../../helper/storage.service';
import { ClusterModel } from '../../../models/cluster.model';
import { ClusterDataService } from '../../data/cluster.data.service';

@Injectable()
export class SelectedClusterDataResolver implements Resolve<ClusterModel> {
  /**
   * Constructor
   */
  constructor(
    private clusterDataService: ClusterDataService,
    private toastV2Service: ToastV2Service,
    private storageService: StorageService
  ) {}

  /**
   * Retrieve data
   */
  resolve(route): Observable<ClusterModel> {
    // retrieve
    return this.clusterDataService
      .getCluster(
        this.storageService.get(StorageKey.SELECTED_OUTBREAK_ID),
        route.params.clusterId
      )
      .pipe(
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
