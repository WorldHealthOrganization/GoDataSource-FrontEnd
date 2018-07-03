import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../../../environments/environment';
import { AuthDataService } from '../data/auth.data.service';
import { LoggerService } from '../helper/logger.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class RequestInterceptor implements HttpInterceptor {

    constructor(
        private loggerService: LoggerService,
        private authDataService: AuthDataService
    ) {
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        // it is recommended to use the 'clone' method when changing the request object
        const clonedRequest = request.clone({
            // set HTTP headers to be applied on request
            setHeaders: this.getHeaders(),
            // normalize HTTP request's URL
            url: this.normalizeUrl(request.url)
        });

        // do NOT log the "logging" request
        if (!/logs$/.test(request.url)) {
            const transactionId = clonedRequest.headers.get('Transaction-Id');

            // log the outgoing Request
            this.loggerService.log(
                `Outgoing HTTP Request: ${clonedRequest.method} ${clonedRequest.url}`,
                `Request Transaction ID: ${transactionId}`
            );
        }

        return next.handle(clonedRequest);
    }

    /**
     * Get HTTP headers to be set on HTTP requests
     * @returns {{}}
     */
    private getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Transaction-Id': uuid()
        };

        // set Auth Header if existing
        const authToken = this.authDataService.getAuthToken();
        if (authToken) {
            headers['Authorization'] = authToken;
        }

        return headers;
    }

    /**
     * Set API prefix if necessary
     * @param {string} url
     * @returns {string}
     */
    private normalizeUrl(url: string): string {
        if (
            url.indexOf('http://') >= 0 ||
            url.indexOf('https://') >= 0
        ) {
            return url;
        } else {
            return `${environment.apiUrl}/${url}`;
        }
    }
}
