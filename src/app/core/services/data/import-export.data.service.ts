import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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
     * @param queryBuilder
     */
    exportData(
        url: string,
        data: {
            fileType: string,
            encryptPassword?: string,
            anonymizeFields?: string[],
            useQuestionVariable?: boolean,
            [otherData: string]: any
        },
        queryBuilder?: RequestQueryBuilder
    ): Observable<Blob>  {
        console.log(data);
        // clone data object
        data = _.cloneDeep(data);

        // url + export type ( json, csv ... )
        let completeURL = `${url}?type=${data.fileType}`;
        delete data.fileType;

        // encryption password
        if (!_.isEmpty(data.encryptPassword)) {
            completeURL += `&encryptPassword=${data.encryptPassword}`;
            delete data.encryptPassword;
        }

        // anonymize fields
        if (!_.isEmpty(data.anonymizeFields)) {
            completeURL += '&anonymizeFields=' + JSON.stringify(data.anonymizeFields);
            delete data.anonymizeFields;
        }

        // add other custom fields caused by API inconsistencies...
        _.each(data, (value: any, key: string) => {
            completeURL += `&${key}=` + (_.isString(value) || _.isNumber(value) ? value : JSON.stringify(value));
        });

        // filter ?
        if (
            queryBuilder &&
            !queryBuilder.isEmpty()
        ) {
            queryBuilder.filter.flag(
                'useQuestionVariable',
                data.useQuestionVariable
            );

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
     * Export Data
     * @param url
     * @param data
     */
    exportPOSTData(
        url: string,
        data: any,
        queryBuilder?: RequestQueryBuilder
    ): Observable<Blob>  {
        console.log(data);
        // filter ?
        if (
            queryBuilder &&
            !queryBuilder.isEmpty()
        ) {
            const filterData = queryBuilder.buildQuery(false);
            if (_.isEmpty(data)) {
                data = {
                    filter: filterData
                };
            } else if (!data.filter) {
                data.filter = filterData;
            } else {
                data.filter = _.merge(
                    data.filter,
                    filterData
                );
            }
        }

        // execute export
        return this.http.post(
            url,
            data, {
                responseType: 'blob'
            }
        );
    }

    /**
     * export images as  pdf
     * @param {{image: string; responseType: string; splitFactor: number}} imageData
     * @returns {Observable<any>}
     */
    exportImageToPdf( imageData: {image: string, responseType: string, splitFactor: number}): Observable<any> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/pdf'});
        return this.http.post(`/system-settings/image-to-pdf/`, imageData,  { headers, responseType: 'blob' });
    }
}

