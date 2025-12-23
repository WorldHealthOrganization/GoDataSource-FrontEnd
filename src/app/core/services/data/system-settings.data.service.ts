import { Injectable } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';
import { ModelHelperService } from '../helper/model-helper.service';
import { SystemSettingsModel } from '../../models/system-settings.model';
import { SystemSettingsVersionModel } from '../../models/system-settings-version.model';
import { CacheKey, CacheService } from '../helper/cache.service';
import { LocalizationHelper } from '../../helperClasses/localization-helper';
import { ILabelValuePairModel } from '../../../shared/forms-v2/core/label-value-pair.model';

@Injectable()
export class SystemSettingsDataService {
  private bypassHttp: HttpClient;

  /**
   * Constructor
   */
  constructor(
    private http: HttpClient,
    private modelHelper: ModelHelperService,
    private cacheService: CacheService,
    httpBackend: HttpBackend          // ← Inject HttpBackend here
  ) {
    // Create a HttpClient that skips any interceptors (uses HttpBackend directly)
    this.bypassHttp = new HttpClient(httpBackend);
  }

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
   * Now reads `assets/runtime-config.json` at runtime—bypassing any interceptors—to get the apiKey.
   */
  private getAPIConf(apiUrl?: string): Observable<SystemSettingsVersionModel> {
    // 1) Fetch the runtime JSON using bypassHttp so that it never goes to /api/…
    return this.bypassHttp.get<{ apiKey: string }>('assets/runtime-config.json').pipe(
      switchMap(config => {
        const apiKey = config.apiKey || '';
        // 2) Build headers using the fetched apiKey
        const headers: any = { 'api-key': apiKey };
        if (apiUrl) {
          headers['ignore-error'] = 'unresponsive';
        }

        // 3) Call the actual version endpoint via the normal http client (this will go through any interceptors)

        return this.modelHelper
          .mapObservableToModel(
            this.http.get(
              `${apiUrl ? apiUrl : ''}/system-settings/version`,
              { headers }
            ),
            SystemSettingsVersionModel
          )
          .pipe(
            tap(versionData => {
              // current instance?
              if (!apiUrl) {
                // cache / update it
                this.cacheService.set(CacheKey.API_VERSION, versionData);

                // set default timezone
                LocalizationHelper.initialize(versionData.timezone);
              }
            })
          );
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

