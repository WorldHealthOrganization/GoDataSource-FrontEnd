import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';

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
     * @param data
     */
    exportData(
        url: string,
        data: {
            fileType: string,
            encryptPassword?: string,
            anonymizeFields?: string[]
        },
        queryBuilder?: RequestQueryBuilder
    ): Observable<Blob>  {
        // url + export type ( json, csv ... )
        let completeURL = `${url}?type=${data.fileType}`;

        // encryption password
        if (!_.isEmpty(data.encryptPassword)) {
            completeURL += `&encryptPassword=${data.encryptPassword}`;
        }

        // anonymize fields
        if (!_.isEmpty(data.anonymizeFields)) {
            completeURL += '&anonymizeFields=' + JSON.stringify(data.anonymizeFields);
        }

        // filter ?
        if (
            queryBuilder &&
            !queryBuilder.isEmpty()
        ) {
            const filter = queryBuilder.buildQuery();
            completeURL += `&filter=${filter}`;
        }

        // execute export
        return this.http.get(
            completeURL, {
                responseType: 'blob'
            }
        );
    }

    /**
     * export images as  pdf
     * @param {{image: string; responseType: string}} imageData
     * @returns {Observable<any>}
     */
    exportImageToPdf( imageData: {image: string, responseType: string, splitFactor: number}): Observable<any> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/pdf'});
        return this.http.post(`/system-settings/image-to-pdf/`, imageData,  { headers, responseType: 'blob' });

    }
}

