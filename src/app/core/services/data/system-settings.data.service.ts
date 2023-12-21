import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { SystemSettingsModel } from '../../models/system-settings.model';
import { SystemSettingsVersionModel } from '../../models/system-settings-version.model';
import { CacheKey, CacheService } from '../helper/cache.service';
import { map, tap } from 'rxjs/operators';
import { LocalizationHelper } from '../../helperClasses/localization-helper';
import { ILabelValuePairModel } from '../../../shared/forms-v2/core/label-value-pair.model';

@Injectable()
export class SystemSettingsDataService {
  /**
     * Constructor
     */
  constructor(
    private http: HttpClient,
    private modelHelper: ModelHelperService,
    private cacheService: CacheService
  ) {}

  /**
     * Retrieve System settings
     * @returns {Observable<SystemSettingsModel>}
     */
  getSystemSettings(): Observable<SystemSettingsModel> {
    return this.modelHelper.mapObservableToModel(
      this.http.get('system-settings'),
      SystemSettingsModel
    );
  }

  /**
     * Modify system settings
     */
  modifySystemSettings(systemSettingsData: any): Observable<any> {
    return this.http.put('system-settings', systemSettingsData);
  }

  /**
     * Get the paths of cloud backups
     * @returns {Observable<any>}
     */
  getCloudBackupPaths(): Observable<any> {
    return this.http.get('/system-settings/backup-location');
  }

  /**
   * Retrieve api version
   */
  private getAPIConf(apiUrl?: string): Observable<SystemSettingsVersionModel> {
    return this.modelHelper
      .mapObservableToModel(
        this.http.get(
          `${apiUrl ? apiUrl : ''}/system-settings/version`, {
            headers: apiUrl ?
              {
                'ignore-error': 'unresponsive'
              } :
              undefined
          }
        ),
        SystemSettingsVersionModel
      )
      .pipe(
        tap((versionData) => {
          // current instance ?
          if (!apiUrl) {
            // cache / update it
            this.cacheService.set(CacheKey.API_VERSION, versionData);

            // set default timezone
            // IMPORTANT: this could be done at user level at a later stage, for now it was proposed but WHO decided to keep it per instance
            LocalizationHelper.initialize(versionData.timezone);
          }
        })
      );
  }

  /**
   * Retrieve api version - no cache ( either local one if apiUrl is empty, or other api if apiUrl starts with http / https )
   */
  getAPIVersionNoCache(apiUrl?: string): Observable<SystemSettingsVersionModel> {
    return this.getAPIConf(apiUrl);
  }

  /**
   * Retrieve api version ( either local one if apiUrl is empty, or other api if apiUrl starts with http / https )
   */
  getAPIVersion(apiUrl?: string): Observable<SystemSettingsVersionModel> {
    const cache = this.cacheService.get(CacheKey.API_VERSION);
    if (
      !apiUrl &&
      cache
    ) {
      return of(cache);
    } else {
      return this.getAPIVersionNoCache(apiUrl);
    }
  }

  /**
   * Retrieve created on values
   */
  getCreatedOnValues(): Observable<ILabelValuePairModel[]> {
    const cache = this.cacheService.get(CacheKey.CREATED_ON);
    if (cache) {
      return of(cache);
    } else {
      return this.http.get('/system-settings/created-on')
        .pipe(
          map((values: {
            id: string,
            name: string
          }[]) => {
            // convert
            const options: ILabelValuePairModel[] = values.map((item) => ({
              value: item.id,
              label: item.name,
              data: item
            }));

            // cache / update it
            this.cacheService.set(CacheKey.CREATED_ON, options);

            // finished
            return options;
          })
        );
    }
  }
}

