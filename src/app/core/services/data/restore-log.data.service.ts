import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { RestoreLogModel } from '../../models/restore-log.model';
import { RequestQueryBuilder, RequestSortDirection } from '../../helperClasses/request-query-builder';
import { IBasicCount } from '../../models/basic-count.interface';

@Injectable()
export class RestoreLogDataService {
  /**
     * Constructor
     */
  constructor(
    private http: HttpClient,
    private modelHelper: ModelHelperService
  ) {}

  /**
   * Retrieve the list
   */
  getRestoreLogList(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<RestoreLogModel[]> {
    // sort backup list by descending date
    const qb = new RequestQueryBuilder();
    if (queryBuilder.sort.isEmpty()) {
      qb.sort.by(
        'actionStartDate',
        RequestSortDirection.DESC
      );
    }

    // include backup data
    queryBuilder.include('backup');

    // merge
    qb.merge(queryBuilder);

    // retrieve data
    const filter = qb.buildQuery();
    return this.modelHelper.mapObservableListToModel(
      this.http.get(`restore-logs?filter=${filter}`),
      RestoreLogModel
    );
  }

  /**
   * Get total number of entries based on the applied filter
   */
  getRestoreLogListCount(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<IBasicCount> {
    const whereFilter = queryBuilder.filter.generateCondition(true);
    return this.http.get(`restore-logs/count?where=${whereFilter}`);
  }

  /**
   * Retrieve an Restore log
   */
  getRestoreLog(restoreLogId: string): Observable<RestoreLogModel> {
    return this.modelHelper.mapObservableToModel(
      this.http.get(`restore-logs/${restoreLogId}`),
      RestoreLogModel
    );
  }
}

