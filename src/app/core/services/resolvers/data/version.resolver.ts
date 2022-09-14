import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { Resolve } from '@angular/router';
import { SystemSettingsVersionModel } from '../../../models/system-settings-version.model';
import { SystemSettingsDataService } from '../../data/system-settings.data.service';
import { catchError } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';

@Injectable()
export class VersionDataResolver implements Resolve<SystemSettingsVersionModel> {
  /**
   * Constructor
   */
  constructor(
    private systemSettingsDataService: SystemSettingsDataService,
    private toastV2Service: ToastV2Service
  ) {}

  /**
   * Resolve response used later
   */
  resolve(): Observable<SystemSettingsVersionModel> {
    // retrieve user information
    return this.systemSettingsDataService
      .getAPIVersion()
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
