import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { IMapResolverV2, IResolverV2ResponseModel } from './models/resolver-response.model';
import { RequestQueryBuilder, RequestSortDirection } from '../../../helperClasses/request-query-builder';
import { AuthDataService } from '../../data/auth.data.service';
import { OutbreakModel } from '../../../models/outbreak.model';
import { OutbreakDataService } from '../../data/outbreak.data.service';
import { ActivatedRouteSnapshot } from '@angular/router';

@Injectable()
export class OutbreakDataResolver implements IMapResolverV2<OutbreakModel> {
  /**
   * Constructor
   */
  constructor(
    private outbreakDataService: OutbreakDataService,
    private toastV2Service: ToastV2Service,
    private authDataService: AuthDataService
  ) {}

  /**
   * Retrieve data
   */
  resolve(route: ActivatedRouteSnapshot): Observable<IResolverV2ResponseModel<OutbreakModel>> {
    // user doesn't have rights ?
    if (!OutbreakModel.canList(this.authDataService.getAuthenticatedUser())) {
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
      'name',
      'deleted'
    );

    // do we need to retrieve deleted outbreaks ?
    if (route.data?.outbreakIncludeDeleted) {
      qb.includeDeleted();
    }

    // sort them
    qb.sort
      .by('name', RequestSortDirection.ASC);

    // retrieve records
    return this.outbreakDataService
      .getOutbreaksList(qb)
      .pipe(
        map((data) => {
          // construct map
          const response: IResolverV2ResponseModel<OutbreakModel> = {
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
