import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { ExportLogModel } from '../../models/export-log.model';

@Injectable()
export class ExportLogDataService {
    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {}

    /**
     * Retrieve an Export log
     */
    getExportLog(exportLogId: string): Observable<ExportLogModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`export-logs/${exportLogId}`),
            ExportLogModel
        );
    }

    /**
     * Download exported file
     */
    download(exportLogId: string): Observable<Blob> {
        return this.http.get(
            `export-logs/${exportLogId}/download`, {
                responseType: 'blob'
            }
        );
    }
}

