import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { Resolve } from '@angular/router';
import { UserRoleModel } from '../../../models/user.model';
import { UserRoleDataService } from '../../data/user-role.data.service';

@Injectable()
export class SelectedUserRoleDataResolver implements Resolve<UserRoleModel> {
  /**
   * Constructor
   */
  constructor(
    private userRoleDataService: UserRoleDataService,
    private toastV2Service: ToastV2Service
  ) {}

  /**
   * Retrieve data
   */
  resolve(route): Observable<UserRoleModel> {
    // get id
    const roleId: string = route.params.cloneId ||
      route.queryParams.cloneId;

    // nothing to retrieve ?
    if (!roleId) {
      return of(null);
    }

    // retrieve
    return this.userRoleDataService
      .getRole(
        roleId
      )
      .pipe(
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
