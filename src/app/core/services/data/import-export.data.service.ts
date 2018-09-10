import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';

@Injectable()
export class ImportExportDataService {

    constructor(
        private http: HttpClient
    ) {}

    /**
     * Import data
     * @param url
     * @param data
     * @returns {Observable<any>}
     */
    importData(url: string, data: {}): Observable<any> {
        return this.http.post(url, data);
    }

    /**
     * Export Data
     * @param url
     * @param fileType
     * @param encryptPassword
     * @returns {Observable<Blob>}
     */
    exportData(
        url: string,
        data: {
            fileType: string,
            encryptPassword?: string
        }
    ): Observable<Blob>  {
        let completeURL = `${url}?type=${data.fileType}`;
        if (!_.isEmpty(data.encryptPassword)) {
            completeURL += `&encryptPassword=${data.encryptPassword}`;
        }
        return this.http.get(
            completeURL, {
                responseType: 'blob'
            }
        );
    }
}

