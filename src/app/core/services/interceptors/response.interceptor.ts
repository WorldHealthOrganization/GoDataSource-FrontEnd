import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as _ from 'lodash';
import { LoggerService } from '../helper/logger.service';
import { Router } from '@angular/router';
import { StorageKey, StorageService } from '../helper/storage.service';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthDataService } from '../data/auth.data.service';
import { AppMessages } from '../../enums/app-messages.enum';
import { ToastV2Service } from '../helper/toast-v2.service';

@Injectable()
export class ResponseInterceptor implements HttpInterceptor {
  /**
     * Constructor
     */
  constructor(
    private loggerService: LoggerService,
    private storageService: StorageService,
    private router: Router,
    private toastV2Service: ToastV2Service,
    private authDataService: AuthDataService
  ) {}

  /**
     * Intercept handler
     */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request)
      .pipe(
        tap((response: HttpResponse<any>) => {
          // check if we got a response
          if (response.status) {
            // do NOT log the "logging" response
            if (!/logs$/.test(request.url)) {
              const transactionId = response.headers.get('Transaction-Id');

              // log the incoming Response
              this.loggerService.log(
                `Incoming HTTP Response for: ${request.method} ${request.url}`,
                `Response status: ${response.status} ${response.statusText}`,
                `Response Transaction ID: ${transactionId}`
              );

              // refresh token expiration
              this.authDataService.resetTokenInfo();
            }
          }

        }),
        catchError((error: HttpErrorResponse) => {
          // do NOT log the "logging" response
          if (!/logs$/.test(request.url)) {
            const transactionId = error.headers.get('Transaction-Id');

            // log the incoming Error Response
            this.loggerService.log(
              `Incoming HTTP Error Response for: ${request.method} ${request.url}`,
              `Response status: ${error.status} ${error.statusText}`,
              `Response Transaction ID: ${transactionId}`,
              'Error:', error.error
            );
          }

          // for 0 response status, ask user to restart the app (the server is unreachable)
          if (error.status === 0) {
            // we have to display a hardcoded message in this situation because we are not able to load the language
            this.toastV2Service.error(
              'The application has become unresponsive. Please do a hard reload or restart Go.Data.',
              {},
              AppMessages.APP_MESSAGE_UNRESPONSIVE
            );
          }

          // for 401 response status, clear the Auth Data
          if (error.status === 401) {
            // remove auth info from local storage
            this.storageService.remove(StorageKey.AUTH_DATA);

            // redirect to Login page
            this.router.navigate(['/auth/login']);
          }

          return throwError(_.get(error, 'error.error', error.error));
        })
      );
  }
}
