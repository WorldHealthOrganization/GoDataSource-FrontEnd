import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { SystemSyncModel } from '../../models/system-sync.model';

@Injectable()
export class SystemSyncDataService {
    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {}

    /**
     * Start sync process
     */
    sync(upstreamServerURL: string): Observable<SystemSyncModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.post('sync', {
                upstreamServerURL: upstreamServerURL
            }),
            SystemSyncModel
        );
    }
}

