import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { IMapResolverV2, IResolverV2ResponseModel } from './models/resolver-response.model';
import { RequestQueryBuilder, RequestSortDirection } from '../../../helperClasses/request-query-builder';
import { AuthDataService } from '../../data/auth.data.service';
import { HelpCategoryModel } from '../../../models/help-category.model';
import { HelpDataService } from '../../data/help.data.service';

@Injectable()
export class HelpCategoryDataResolver implements IMapResolverV2<HelpCategoryModel> {
  /**
   * Constructor
   */
  constructor(
    private helpDataService: HelpDataService,
    private toastV2Service: ToastV2Service,
    private authDataService: AuthDataService
  ) {}

  /**
   * Retrieve data
   */
  resolve(): Observable<IResolverV2ResponseModel<HelpCategoryModel>> {
    // user doesn't have rights ?
    if (!HelpCategoryModel.canList(this.authDataService.getAuthenticatedUser())) {
      return of({
        list: [],
        map: {},
        options: []
      });
    }

    // construct query
    const qb = new RequestQueryBuilder();
    qb.fields(
      'id',
      'name'
    );

    // sort them
    qb.sort
      .by('name', RequestSortDirection.ASC);

    // retrieve users
    return this.helpDataService
      .getHelpCategoryList(qb)
      .pipe(
        map((data) => {
          // construct map
          const response: IResolverV2ResponseModel<HelpCategoryModel> = {
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
