import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as _ from 'lodash';

@Injectable()
export class LoggingDataService {

    constructor(
        private http: HttpClient
    ) {
    }

    /**
     * Add a new Log message in API
     * @param {string[]} messages
     * @returns {Observable<any>}
     */
    log(messages: string[]): Observable<any> {
        const data = {
            messages: _.map(messages, (message) => {
                // all messages have leve 'debug' for now
                return {
                    level: 'debug',
                    message: message
                };
            })
        };

        return this.http.post(`logs`, data);
    }
}

