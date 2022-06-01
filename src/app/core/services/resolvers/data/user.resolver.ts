import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { IMapResolverV2, IResolverV2ResponseModel } from './models/resolver-response.model';
import { UserModel } from '../../../models/user.model';
import { UserDataService } from '../../data/user.data.service';
import { RequestQueryBuilder, RequestSortDirection } from '../../../helperClasses/request-query-builder';
import { AuthDataService } from '../../data/auth.data.service';

@Injectable()
export class UserDataResolver implements IMapResolverV2<UserModel> {
  /**
   * Constructor
   */
  constructor(
    private userDataService: UserDataService,
    private toastV2Service: ToastV2Service,
    private authDataService: AuthDataService
  ) {}

  /**
   * Retrieve data
   */
  resolve(): Observable<IResolverV2ResponseModel<UserModel>> {
    // user doesn't have rights ?
    if (!UserModel.canListForFilters(this.authDataService.getAuthenticatedUser())) {
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
      'firstName',
      'lastName'
    );

    // sort them
    qb.sort
      .by('firstName', RequestSortDirection.ASC)
      .by('lastName', RequestSortDirection.ASC);

    // retrieve users
    return this.userDataService
      .getUsersList(qb)
      .pipe(
        map((data) => {
          // construct map
          const response: IResolverV2ResponseModel<UserModel> = {
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
