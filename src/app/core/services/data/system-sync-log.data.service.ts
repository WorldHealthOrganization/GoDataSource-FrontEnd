import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { SystemSyncLogModel } from '../../models/system-sync-log.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { IBasicCount } from '../../models/basic-count.interface';

@Injectable()
export class SystemSyncLogDataService {
  /**
     * Constructor
     */
  constructor(
    private http: HttpClient,
    private modelHelper: ModelHelperService
  ) {
  }

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

  /**
     * Retrieve the list of Sync logs
     */
  getSyncLogList(
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<SystemSyncLogModel[]> {
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableListToModel(
      this.http.get(`sync-logs?filter=${filter}`),
      SystemSyncLogModel
    );
  }

  /**
     * Return count of Sync logs
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<IBasicCount>}
     */
  getSyncLogsCount(
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<IBasicCount> {
    const whereFilter = queryBuilder.filter.generateCondition(true);
    return this.http.get(`sync-logs/count?where=${whereFilter}`);
  }

  /**
     * Delete an existing Sync log
     * @param {string} caseId
     * @returns {Observable<any>}
     */
  deleteSyncLog(syncLogId: string): Observable<any> {
    return this.http.delete(`sync-logs/${syncLogId}`);
  }

  /**
     * Delete an existing Sync log
     * @returns {Observable<any>}
     */
  deleteSyncLogs(
    queryBuilder: RequestQueryBuilder
  ): Observable<any> {
    const whereFilter = queryBuilder.filter.generateCondition(true);
    return this.http.delete(`sync-logs?where=${whereFilter}`);
  }
}
