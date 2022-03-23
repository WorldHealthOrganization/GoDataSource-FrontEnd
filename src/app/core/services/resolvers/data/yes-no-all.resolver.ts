import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { Resolve } from '@angular/router';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { GenericDataService } from '../../data/generic.data.service';

@Injectable()
export class YesNoAllDataResolver implements Resolve<ILabelValuePairModel[]> {
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
  resolve(): Observable<ILabelValuePairModel[]> {
    return this.genericDataService
      .getFilterYesNoOptions()
      .pipe(
        map((data) => {
          // construct map
          const response: ILabelValuePairModel[] = [];
          data.forEach((item) => {
            response.push({
              label: item.label,
              value: item.value
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
