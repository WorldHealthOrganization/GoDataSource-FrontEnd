import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { IMapResolverV2, IResolverV2ResponseModel } from './models/resolver-response.model';
import { ReferenceDataDataService } from '../../data/reference-data.data.service';
import { ReferenceDataCategory, ReferenceDataEntryModel } from '../../../models/reference-data.model';
import { catchError, map } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';

@Injectable()
export class FinalFollowUpStatusDataResolver implements IMapResolverV2<ReferenceDataEntryModel> {
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
  resolve(): Observable<IResolverV2ResponseModel<ReferenceDataEntryModel>> {
    return this.referenceDataDataService
      .getReferenceDataByCategory(ReferenceDataCategory.CONTACT_FINAL_FOLLOW_UP_STATUS)
      .pipe(
        map((data) => {
          // construct map
          const entries: ReferenceDataEntryModel[] = data.entries || [];
          const response: IResolverV2ResponseModel<ReferenceDataEntryModel> = {
            list: entries,
            map: {},
            options: []
          };
          entries.forEach((item) => {
            // map
            response.map[item.id] = item;

            // add option
            response.options.push({
              label: item.value,
              value: item.id,
              iconUrl: item.iconUrl,
              data: item,
              disabled: !item.active
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
