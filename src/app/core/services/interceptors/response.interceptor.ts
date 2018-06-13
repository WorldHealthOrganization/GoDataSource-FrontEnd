import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/catch';
import * as _ from 'lodash';
import { LoggerService } from '../helper/logger.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Router } from '@angular/router';

@Injectable()
export class ResponseInterceptor implements HttpInterceptor {

    constructor(
        private loggerService: LoggerService,
        private router: Router
    ) {
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        return next.handle(request)
            .do((response: HttpResponse<any>) => {

                // check if we got a response
                if (response.status) {
                    // log the incoming Response
                    this.loggerService.log(
                        `Incoming HTTP Response for: ${request.method} ${request.url}`,
                        `Response status: ${response.status} ${response.statusText}`,
                        `Response body:`, response.body
                    );
                }

            })
            .catch((error: HttpErrorResponse) => {
                // log the incoming Error Response
                this.loggerService.log(
                    `Incoming HTTP Error Response for: ${request.method} ${request.url}`,
                    `Response status: ${error.status} ${error.statusText}`,
                    `Error:`, error.error
                );

                // for 401 response status, clear the Auth Data
                if (error.status === 401) {
                    // redirect to logout page
                    this.router.navigate(['/auth/logout']);
                }

                return ErrorObservable.create(_.get(error, 'error.error', error.error));
            });
    }
}
