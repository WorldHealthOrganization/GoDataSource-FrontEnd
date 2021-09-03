import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as _ from 'lodash';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { IAsyncImportResponse, IImportableFileDistinctValues } from '../../../features/import-export-data/components/import-data/model';
import { IAsyncExportResponse } from '../helper/dialog.service';

@Injectable()
export class ImportExportDataService {
    /**
     * Constructor
     */
    constructor(
        private http: HttpClient
    ) {}

    /**
     * Import data
     */
    importData(
        url: string,
        data: {}
    ): Observable<any | IAsyncImportResponse> {
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
            fieldsGroupList?: string[],
            useDbColumns?: boolean,
            jsonReplaceUndefinedWithNull?: boolean,
            dontTranslateValues?: boolean,
            useQuestionVariable?: boolean,
            [otherData: string]: any
        },
        queryBuilder?: RequestQueryBuilder,
        responseType: 'blob' | 'json' = 'blob'
    ): Observable<Blob | IAsyncExportResponse>  {
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

        // fields groups
        if (!_.isEmpty(data.fieldsGroupList)) {
            // send the fields group list
            completeURL += '&fieldsGroupList=' + JSON.stringify(data.fieldsGroupList);
            delete data.fieldsGroupList;
        }

        // add flag useDbColumns
        if (!_.isUndefined(data.useDbColumns)) {
            queryBuilder.filter.flag(
                'useDbColumns',
                data.useDbColumns
            );
            delete data.useDbColumns;
        }

        // add flag jsonReplaceUndefinedWithNull
        if (!_.isUndefined(data.jsonReplaceUndefinedWithNull)) {
            queryBuilder.filter.flag(
                'jsonReplaceUndefinedWithNull',
                data.jsonReplaceUndefinedWithNull
            );
            delete data.jsonReplaceUndefinedWithNull;
        }

        // add flag dontTranslateValues
        if (!_.isUndefined(data.dontTranslateValues)) {
            queryBuilder.filter.flag(
                'dontTranslateValues',
                data.dontTranslateValues
            );
            delete data.dontTranslateValues;
        }

        // add flag useQuestionVariable
        if (!_.isUndefined(data.useQuestionVariable)) {
            queryBuilder.filter.flag(
                'useQuestionVariable',
                data.useQuestionVariable
            );
            delete data.useQuestionVariable;
        }

        // add flag includeContactFields
        if (!_.isUndefined(data.includeContactFields)) {
            queryBuilder.filter.flag(
                'includeContactFields',
                data.includeContactFields
            );
            delete data.includeContactFields;
        }

        // add flag includeCaseFields
        if (!_.isUndefined(data.includeCaseFields)) {
            queryBuilder.filter.flag(
                'includeCaseFields',
                data.includeCaseFields
            );
            delete data.includeCaseFields;
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
            const filter = queryBuilder.buildQuery();
            completeURL += `&filter=${filter}`;
        }

        // execute export
        return responseType === 'blob' ?
            this.http.get(
                completeURL, {
                    responseType: 'blob'
                }
            ) :
            (this.http.get(
                completeURL, {
                    responseType: 'json'
                }
            ) as Observable<IAsyncExportResponse>);
    }

    /**
     * Export Data
     * @param url
     * @param data
     */
    exportPOSTData(
        url: string,
        data: any,
        queryBuilder?: RequestQueryBuilder,
        responseType: 'blob' | 'json' = 'blob'
    ): Observable<Blob | IAsyncExportResponse>  {
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
        return responseType === 'blob' ?
            this.http.post(
                url,
                data, {
                    responseType: 'blob'
                }
            ) :
            (this.http.post(
                url,
                data, {
                    responseType: 'json'
                }
            ) as Observable<IAsyncExportResponse>);
    }

    /**
     * export images as  pdf
     * @param {{image: string; responseType: string; splitFactor: number}} imageData
     * @returns {Observable<any>}
     */
    exportImageToPdf( imageData: {image: string, responseType: string, splitFactor: number}): Observable<any> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/pdf'});
        return this.http.post('/system-settings/image-to-pdf/', imageData,  { headers, responseType: 'blob' });
    }

    /**
     * Determine distinct values
     * @param fileId
     * @param headers
     */
    determineDistinctValues(
        fileId: string,
        headers: string[]
    ): Observable<IImportableFileDistinctValues> {
        return this.http.post(
            `/importable-files/${fileId}/distinct-values-json`, {
                headers: headers
            }
        ) as Observable<IImportableFileDistinctValues>;
    }
}

