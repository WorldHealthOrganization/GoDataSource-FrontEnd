import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { ExportLogModel } from '../../models/export-log.model';
import { catchError } from 'rxjs/operators';
import { FileSize } from '../../helperClasses/file-size';

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
    download(
        exportLogId: string,
        progressCallback: (progress: string) => void
    ): Observable<Blob> {
        return new Observable<Blob>((observer) => {
            this.http
                .get(
                    `export-logs/${exportLogId}/download`, {
                        responseType: 'blob',
                        reportProgress: true,
                        observe: 'events'
                    }
                )
                .pipe(
                    catchError((err) => {
                        observer.error(err);
                        observer.complete();
                        return throwError(err);
                    })
                )
                .subscribe((response) => {
                    // handle download progress
                    switch (response.type) {
                        case HttpEventType.DownloadProgress:
                            if (progressCallback) {
                                progressCallback(
                                    FileSize.bytesToReadableForm(response.loaded)
                                );
                            }
                            break;

                        case HttpEventType.Response:
                            observer.next(response.body);
                            observer.complete();
                            break;
                    }
                });
        });
    }
}

