import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { AuditLogModel } from '../../models/audit-log.model';

@Injectable()
export class AuditLogDataService {
    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {}

    /**
     * Retrieve audit logs
     * @param {RequestQueryBuilder} queryBuilder Required since we shouldn't retrieve all of them at a time...
     * @returns {Observable<AuditLogModel[]>}
     */
    getAuditLogsList(queryBuilder: RequestQueryBuilder): Observable<AuditLogModel[]> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`audit-logs?filter=${filter}`),
            AuditLogModel
        );
    }

    /**
     * Return count of audit logs
     * @param {RequestQueryBuilder} queryBuilder Required since we shouldn't retrieve all of them at a time...
     * @returns {Observable<any>}
     */
    getAuditLogsCount(queryBuilder: RequestQueryBuilder): Observable<any> {
        const whereFilter = queryBuilder.filter.generateCondition(true);
        return this.http.get(`audit-logs/count?where=${whereFilter}`);
    }
}

