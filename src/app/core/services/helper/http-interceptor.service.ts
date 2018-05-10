import { Injectable, Injector } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpHeaders, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import { environment } from '../../../../environments/environment';

import { AuthDataService } from '../data/auth.data.service';

@Injectable()
export class HttpInterceptorService implements HttpInterceptor {

    constructor(
        private injector: Injector
    ) {
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        const auth = this.injector.get(AuthDataService);

        // set HTTP headers
        const headers = {
            'Content-Type': 'application/json'
        };

        // set Auth Header if existing
        const authToken = auth.getAuthToken();
        if (authToken) {
            headers['Authorization'] = authToken;
        }

        // it is recommended to use the 'clone' method when changing the request
        const clonedRequest = request.clone({
            headers: new HttpHeaders(headers),
            url: this.normalizeUrl(request.url)
        });

        return next.handle(clonedRequest);
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
