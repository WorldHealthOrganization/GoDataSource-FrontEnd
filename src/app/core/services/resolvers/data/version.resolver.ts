import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Resolve } from '@angular/router';
import { SystemSettingsVersionModel } from '../../../models/system-settings-version.model';
import { SystemSettingsDataService } from '../../data/system-settings.data.service';

@Injectable()
export class VersionDataResolver implements Resolve<Observable<SystemSettingsVersionModel>> {
  /**
   * Constructor
   */
  constructor(
    private systemSettingsDataService: SystemSettingsDataService
  ) {}

  /**
   * Resolve response used later
   */
  resolve(): Observable<SystemSettingsVersionModel> {
    // retrieve user information
    return this.systemSettingsDataService.getAPIVersion();
  }
}
