import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { PermissionModel } from '../../../models/permission.model';
import { UserRoleDataService } from '../../data/user-role.data.service';
import { Resolve } from '@angular/router';

@Injectable()
export class PermissionDataResolver implements Resolve<PermissionModel[]> {
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
  resolve(): Observable<PermissionModel[]> {
    // retrieve users
    return this.userRoleDataService
      .getAvailablePermissions()
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
