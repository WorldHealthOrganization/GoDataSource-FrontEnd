import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { HierarchicalLocationModel } from '../../../models/hierarchical-location.model';
import { LocationDataService } from '../../data/location.data.service';
import { Resolve } from '@angular/router';

@Injectable()
export class LocationTreeDataResolver implements Resolve<HierarchicalLocationModel> {
  /**
   * Constructor
   */
  constructor(
    private locationDataService: LocationDataService,
    private toastV2Service: ToastV2Service
  ) {}

  /**
   * Retrieve data
   */
  resolve(activatedRoute): Observable<HierarchicalLocationModel> {
    // location id
    const locationId: string = activatedRoute.params?.parentId;

    // nothing to retrieve ?
    if (!locationId) {
      return of(null);
    }

    // retrieve data
    return this.locationDataService
      .getHierarchicalParentListOfLocation(locationId)
      .pipe(
        map((data) => {
          return data?.length > 0 ?
            data[0] :
            null;
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
