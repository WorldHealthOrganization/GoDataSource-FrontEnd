import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { BackupModel } from '../../models/backup.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { RequestSortDirection } from '../../helperClasses/request-query-builder/request-sort';
import { IBasicCount } from '../../models/basic-count.interface';

@Injectable()
export class SystemBackupDataService {
    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {
    }

    /**
     * Create backup
     */
    createBackup(backupSettings: any = null): Observable<BackupModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.post('backups', backupSettings),
            BackupModel
        );
    }

    /**
     * Retrieve the list of backups
     */
    getBackupList(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<BackupModel[]> {
        // sort backup list by descending date
        const qb = new RequestQueryBuilder();

        if (queryBuilder.sort.isEmpty()) {
            qb.sort.by('date', RequestSortDirection.DESC);
        }

        // include user data
        queryBuilder.include(`user`);
        qb.merge(queryBuilder);

        const filter = qb.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`backups?filter=${filter}`),
            BackupModel
        );
    }

    /**
     * Get total number of entries based on the applied filter
     * @returns {Observable<IBasicCount>}
     */
    getBackupListCount(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<IBasicCount> {
        const whereFilter = queryBuilder.filter.generateCondition(true);
        return this.http.get(`backups/count?where=${whereFilter}`);
    }

    /**
     * Delete an existing backup
     * @param {string} backupId
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

