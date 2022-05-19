import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Resolve } from '@angular/router';
import { SystemSettingsDataService } from '../../data/system-settings.data.service';
import { SystemSettingsModel } from '../../../models/system-settings.model';

@Injectable()
export class SystemSettingsDataResolver implements Resolve<Observable<SystemSettingsModel>> {
  /**
   * Constructor
   */
  constructor(
    private systemSettingsDataService: SystemSettingsDataService
  ) {}

  /**
   * Resolve response used later
   */
  resolve(): Observable<SystemSettingsModel> {
    // retrieve
    return this.systemSettingsDataService.getSystemSettings();
  }
}
