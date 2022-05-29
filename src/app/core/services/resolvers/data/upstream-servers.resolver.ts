import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { Resolve } from '@angular/router';
import { SystemSettingsDataService } from '../../data/system-settings.data.service';
import { SystemUpstreamServerModel } from '../../../models/system-upstream-server.model';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class UpstreamServersDataResolver implements Resolve<SystemUpstreamServerModel[]> {
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
  resolve(): Observable<SystemUpstreamServerModel[]> {
    // retrieve user information
    return this.systemSettingsDataService
      .getSystemSettings()
      .pipe(
        // map
        map((data) => {
          return data.upstreamServers || [];
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
