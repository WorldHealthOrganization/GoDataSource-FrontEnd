import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { IMapResolverV2, IResolverV2ResponseModel } from './models/resolver-response.model';
import { UserModel } from '../../../models/user.model';
import { UserDataService } from '../../data/user.data.service';
import { AuthDataService } from '../../data/auth.data.service';
import { RequestQueryBuilder } from '../../../helperClasses/request-query-builder';

@Injectable()
export class DeletedUserDataResolver implements IMapResolverV2<UserModel> {
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

    // query builder
    const qb: RequestQueryBuilder = new RequestQueryBuilder();
    qb.filter.includeDeletedRecordsWhereField();
    qb.filter.where({
      deleted: {
        eq: true
      }
    });

    // retrieve only deleted users
    // IMPORTANT: no need to specify fields or sort rules since this is done automatically by API for users/for-filters endpoint
    return this.userDataService
      .getUsersListForFilters(qb)
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
              label: item.nameAndEmail,
              value: item.id,
              data: item,
              disabled: item.deleted
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
