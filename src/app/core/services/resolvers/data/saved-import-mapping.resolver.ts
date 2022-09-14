import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { IMapResolverV2, IResolverV2ResponseModel } from './models/resolver-response.model';
import { RequestQueryBuilder, RequestSortDirection } from '../../../helperClasses/request-query-builder';
import { SavedImportMappingModel } from '../../../models/saved-import-mapping.model';
import { SavedImportMappingService } from '../../data/saved-import-mapping.data.service';

@Injectable()
export class SavedImportMappingDataResolver implements IMapResolverV2<SavedImportMappingModel> {
  /**
   * Constructor
   */
  constructor(
    private savedImportMappingService: SavedImportMappingService,
    private toastV2Service: ToastV2Service
  ) {}

  /**
   * Retrieve data
   */
  resolve(route): Observable<IResolverV2ResponseModel<SavedImportMappingModel>> {
    // do we need to retrieve import mappings ?
    if (!route.data.savedImportPage) {
      return of({
        list: [],
        map: {},
        options: []
      });
    }

    // specify for what page we want to get the saved items
    const qb = new RequestQueryBuilder();
    qb.filter.where({
      mappingKey: {
        eq: route.data.savedImportPage
      }
    });

    // since mappingData could be really big we need to retrieve only what is used by the list followed by retrieving more data if we need it
    qb.fields(
      'id',
      'name',
      'readOnly',

      // required by API - it should be added by api, but at the moment it doesn't work like this
      'userId'
    );

    // sort them
    qb.sort
      .by('name', RequestSortDirection.ASC);

    // retrieve users
    return this.savedImportMappingService
      .getImportMappingsList(qb)
      .pipe(
        map((data) => {
          // construct map
          const response: IResolverV2ResponseModel<SavedImportMappingModel> = {
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
