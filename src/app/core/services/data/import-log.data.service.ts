import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { ImportLogModel } from '../../models/import-log.model';

@Injectable()
export class ImportLogDataService {
    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {}

    /**
     * Retrieve an Import log
     */
    getImportLog(
        importLogId: string,
        retrieveCreatedUpdatedBy?: boolean
    ): Observable<ImportLogModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`import-logs/${importLogId}${retrieveCreatedUpdatedBy ? '?retrieveCreatedUpdatedBy=1' : ''}`),
            ImportLogModel
        );
    }
}

