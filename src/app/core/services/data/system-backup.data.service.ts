import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { BackupModel } from '../../models/backup.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';

@Injectable()
export class SystemBackupDataService {
    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {}

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

    /**
     * Delete an existing backup
     * @param {string} caseId
     * @returns {Observable<any>}
     */
    deleteBackup(backupId: string): Observable<any> {
        return this.http.delete(`backups/${backupId}`);
    }

    /**
     * Retrieve a backup
     * @param {string} backupId
     * @returns {Observable<BackupModel>}
     */
    getBackup(backupId: string): Observable<BackupModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`backups/${backupId}`),
            BackupModel
        );
    }

    /**
     * Restore backup
     * @param backupId
     */
    restoreBackup(backupId: string): Observable<any> {
        return this.http.post(`backups/${backupId}/restore`, {});
    }
}

