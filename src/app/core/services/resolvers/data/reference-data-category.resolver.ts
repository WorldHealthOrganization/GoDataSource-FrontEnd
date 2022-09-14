import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { ReferenceDataCategory, ReferenceDataCategoryModel } from '../../../models/reference-data.model';
import { Resolve } from '@angular/router';
import { ReferenceDataDataService } from '../../data/reference-data.data.service';

@Injectable()
export class ReferenceDataCategoryDataResolver implements Resolve<ReferenceDataCategoryModel> {
  /**
   * Constructor
   */
  constructor(
    private referenceDataDataService: ReferenceDataDataService,
    private toastV2Service: ToastV2Service
  ) {}

  /**
   * Retrieve data
   */
  resolve(activatedRoute): Observable<ReferenceDataCategoryModel> {
    // retrieve categoryId
    let categoryId: ReferenceDataCategory = activatedRoute.params.categoryId;
    categoryId = categoryId || activatedRoute.queryParams.categoryId;

    // not found ?
    if (!categoryId) {
      return of(null);
    }

    // retrieve category info
    return this.referenceDataDataService
      .getReferenceDataByCategory(categoryId)
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
