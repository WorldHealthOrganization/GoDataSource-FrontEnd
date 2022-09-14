import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { IMapResolverV2, IResolverV2ResponseModel } from './models/resolver-response.model';
import { RequestQueryBuilder, RequestSortDirection } from '../../../helperClasses/request-query-builder';
import { LanguageModel } from '../../../models/language.model';
import { LanguageDataService } from '../../data/language.data.service';

@Injectable()
export class LanguageDataResolver implements IMapResolverV2<LanguageModel> {
  /**
   * Constructor
   */
  constructor(
    private languageDataService: LanguageDataService,
    private toastV2Service: ToastV2Service
  ) {}

  /**
   * Retrieve data
   */
  resolve(): Observable<IResolverV2ResponseModel<LanguageModel>> {
    // construct query
    const qb = new RequestQueryBuilder();
    qb.fields(
      'id',
      'name'
    );

    // sort them
    qb.sort
      .by('name', RequestSortDirection.ASC);

    // retrieve records
    return this.languageDataService
      .getLanguagesList(qb)
      .pipe(
        map((data) => {
          // construct map
          const response: IResolverV2ResponseModel<LanguageModel> = {
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
