import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import {
  ReferenceDataCategory,
  ReferenceDataCategoryModel,
} from '../../../models/reference-data.model';
import { ReferenceDataDataService } from '../../data/reference-data.data.service';
import { IMapResolverV2, IResolverV2ResponseModel } from './models/resolver-response.model';

@Injectable()
export class ReferenceDataDiseaseSpecificCategoriesResolver implements IMapResolverV2<ReferenceDataCategoryModel> {
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
  resolve(activatedRoute): Observable<IResolverV2ResponseModel<ReferenceDataCategoryModel>> {
    // execute only if we need this data
    // create / view / modify - outbreak, outbreak template and reference data item only if disease category
    const retrieveEntries: boolean = !activatedRoute?.data?.diseaseSpecificCategoriesConf?.excludeEntries && (
      !activatedRoute.params?.categoryId ||
      activatedRoute.params.categoryId === ReferenceDataCategory.LNG_REFERENCE_DATA_CATEGORY_DISEASE
    );

    // retrieve category info
    return this.referenceDataDataService
      .getReferenceDataItemsPerDisease(retrieveEntries)
      .pipe(
        map((data) => {
          // construct map
          const response: IResolverV2ResponseModel<ReferenceDataCategoryModel> = {
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
