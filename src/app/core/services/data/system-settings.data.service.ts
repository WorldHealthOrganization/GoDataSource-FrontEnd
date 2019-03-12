import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { SystemSettingsModel } from '../../models/system-settings.model';
import { SystemSettingsVersionModel } from '../../models/system-settings-version.model';

@Injectable()
export class SystemSettingsDataService {
    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
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
        return this.http.get(`/system-settings/backup-location`);
    }

    /**
     * Retrieve api version ( either local one if apiUrl is empty, or other api if apiUrl starts with http / https )
     * @param apiUrl
     */
    getAPIVersion(
        apiUrl: string
    ): Observable<SystemSettingsVersionModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`${apiUrl}/system-settings/version`),
            SystemSettingsVersionModel
        );
    }

    /**
     * Retrieve versions number
     * @returns {Observable<Object>}
     */
    getVersionsNumber() {
        return this.http.get('/system-settings/version');
    }
}

