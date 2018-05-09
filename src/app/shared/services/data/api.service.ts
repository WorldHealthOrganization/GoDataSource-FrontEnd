import { environment } from '../../../../environments/environment';
import { catchError, tap } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { HttpClient } from '@angular/common/http';
import { Optional } from '@angular/core';
import * as _ from 'lodash';

export class ApiService {

    // HTTP client used for making API requests
    httpClient: HttpClient;
    // API base URL
    apiUrl: string = environment.apiUrl;

    constructor(
        @Optional() http: HttpClient
    ) {
        this.httpClient = http;
    }

    /**
     * Make an API call of type GET
     * @param {string} url
     * @returns {Observable<any>}
     */
    get(url: string) {

        // #TODO logging
        console.log(`GET ${url} request`);

        return this.httpClient
            .get(url)
            .pipe(
                tap(response => {
                    // #TODO logging
                    console.log(`GET ${url} response: ${JSON.stringify(response)}`);
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Make an API call of type GET
     * @param {string} url
     * @param data
     * @returns {Observable<any>}
     */
    post(url: string , data: any) {

        // #TODO logging
        console.log(`POST ${url} request with body: ${JSON.stringify(data)}`);

        return this.httpClient
            .post(url, data)
            .pipe(
                tap(response => {
                    // #TODO logging
                    console.log(`POST ${url} response: ${JSON.stringify(response)}`);
                }),
                catchError(this.handleError)
            );
    }

    handleError(error: Response | any) {
        // #TODO
        const body = _.isFunction(error.json) ? error.json() : '';
        const err = body.error || JSON.stringify(body);

        console.error(`HTTP error: ${err}`);

        return Observable.throw(err);
    }
}
