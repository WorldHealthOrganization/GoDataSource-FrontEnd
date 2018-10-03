import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { SystemSettingsModel } from '../../models/system-settings.model';
import { BackupModel } from '../../models/backup.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';

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
     * Create backup
     */
    createBackup(backupSettings: any = null): Observable<BackupModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.post('backups/create-backup', backupSettings),
            BackupModel
        );
    }

    /**
     * Retrieve the list of backups
     */
    getBackupList(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<BackupModel[]> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`backups?filter=${filter}`),
            BackupModel
        );
    }
}

