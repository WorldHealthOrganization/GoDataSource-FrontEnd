import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { RestoreLogModel } from '../../models/restore-log.model';

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
   * Retrieve an Restore log
   */
  getRestoreLog(restoreLogId: string): Observable<RestoreLogModel> {
    return this.modelHelper.mapObservableToModel(
      this.http.get(`restore-logs/${restoreLogId}`),
      RestoreLogModel
    );
  }
}

