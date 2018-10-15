import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { SystemSyncLogModel } from '../../models/system-sync-log.model';

@Injectable()
export class SystemSyncLogDataService {
    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {}

    /**
     * Retrieve a sync log
     * @param {string} syncLogId
     * @returns {Observable<SystemSyncLogModel>}
     */
    getSyncLog(syncLogId: string): Observable<SystemSyncLogModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`sync-logs/${syncLogId}`),
            SystemSyncLogModel
        );
    }
}

