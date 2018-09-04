import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class ImportExportDataService {

    constructor(
        private http: HttpClient
    ) {}

    /**
     * Import data
     * @param url
     * @param data
     */
    importData(url: string, data: {}): Observable<any> {
        return this.http.post(url, data);
    }

    /**
     * Export Data
     * @param url
     * @param fileType
     */
    exportData(url: string, fileType: string): Observable<any>  {
        return this.http.get(
            `${url}?type=${fileType}`, {
                responseType: 'blob'
            }
        );
    }
}

