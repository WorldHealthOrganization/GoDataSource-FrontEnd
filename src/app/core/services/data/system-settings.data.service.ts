import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { SystemSettingsModel } from '../../models/system-settings.model';
import { SystemSettingsVersionModel } from '../../models/system-settings-version.model';
import { CacheKey, CacheService } from '../helper/cache.service';
import { tap } from 'rxjs/operators';
import * as _ from 'lodash';
import { of } from 'rxjs';

@Injectable()
export class SystemSettingsDataService {
    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService,
        private cacheService: CacheService
    ) {
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
        return this.http.get(`/system-settings/backup-location`);
    }

    /**
     * Retrieve api version ( either local one if apiUrl is empty, or other api if apiUrl starts with http / https )
     * @param apiUrl
     */
    getAPIVersion(
        apiUrl: string = ''
    ): Observable<SystemSettingsVersionModel> {
        const callingLocalAPI: boolean = _.isEmpty(apiUrl);
        const cache = this.cacheService.get(CacheKey.API_VERSION);
        if (
            callingLocalAPI &&
            cache
        ) {
            return of(cache);
        } else {
            return this.modelHelper
                .mapObservableToModel(
                    this.http.get(`${apiUrl}/system-settings/version`),
                    SystemSettingsVersionModel
                )
                .pipe(
                    tap((versionData) => {
                        if (callingLocalAPI) {
                            this.cacheService.set(CacheKey.API_VERSION, versionData);
                        }
                    })
                );
        }
    }
}

