import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { IMapResolverV2, IResolverV2ResponseModel } from './models/resolver-response.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { SystemSettingsDataService } from '../../data/system-settings.data.service';

@Injectable()
export class CreatedOnResolver implements IMapResolverV2<ILabelValuePairModel> {
  /**
   * Constructor
   */
  constructor(
    private systemSettingsDataService: SystemSettingsDataService,
    private toastV2Service: ToastV2Service
  ) {}

  /**
   * Retrieve data
   */
  resolve(): Observable<IResolverV2ResponseModel<ILabelValuePairModel>> {
    return this.systemSettingsDataService
      .getCreatedOnValues()
      .pipe(
        map((data) => {
          // construct map
          const response: IResolverV2ResponseModel<ILabelValuePairModel> = {
            list: data,
            map: {},
            options: data
          };
          data.forEach((item) => {
            // map
            response.map[item.value] = item;
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
