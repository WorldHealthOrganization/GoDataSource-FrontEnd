import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { ReferenceDataCategory, ReferenceDataCategoryModel } from '../../../models/reference-data.model';
import { Resolve } from '@angular/router';
import { ReferenceDataDataService } from '../../data/reference-data.data.service';

@Injectable()
export class ReferenceDataDiseaseSpecificCategoriesResolver implements Resolve<ReferenceDataCategoryModel[]> {
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
  resolve(activatedRoute): Observable<ReferenceDataCategoryModel[]> {
    // execute only if we need this data
    // create / view / modify - outbreak, outbreak template and reference data item only if disease category
    if (
      activatedRoute.params?.categoryId &&
      activatedRoute.params.categoryId !== ReferenceDataCategory.LNG_REFERENCE_DATA_CATEGORY_DISEASE
    ) {
      return;
    }

    // retrieve category info
    return this.referenceDataDataService
      .getReferenceDataItemsPerDisease()
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
