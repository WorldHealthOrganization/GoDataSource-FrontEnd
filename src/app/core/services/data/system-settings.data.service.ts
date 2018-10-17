import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { SystemSettingsModel } from '../../models/system-settings.model';

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
     * Retrieve a Case of an Outbreak
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
}

