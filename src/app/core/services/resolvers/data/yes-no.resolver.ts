import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { GenericDataService } from '../../data/generic.data.service';
import { IMapResolverV2, IResolverV2ResponseModel } from './models/resolver-response.model';

@Injectable()
export class YesNoDataResolver implements IMapResolverV2<ILabelValuePairModel> {
  /**
   * Constructor
   */
  constructor(
    private genericDataService: GenericDataService,
    private toastV2Service: ToastV2Service
  ) {}

  /**
   * Retrieve data
   */
  resolve(): Observable<IResolverV2ResponseModel<ILabelValuePairModel>> {
    return this.genericDataService
      .getFilterYesNoOptions(true)
      .pipe(
        map((data) => {
          // construct map
          const response: IResolverV2ResponseModel<ILabelValuePairModel> = {
            list: data,
            map: {},
            options: []
          };
          data.forEach((item) => {
            // map
            response.map[item.id] = item;

            // add option
            response.options.push({
              label: item.label,
              value: item.value,
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
