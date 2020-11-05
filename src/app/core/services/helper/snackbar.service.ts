import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import * as _ from 'lodash';
import { I18nService } from './i18n.service';
import { Observable } from 'rxjs/internal/Observable';
import { forkJoin, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { of } from 'rxjs/internal/observable/of';
import { MultipleSnackbarComponent } from '../../../shared/components/multiple-snackbar/multiple-snackbar.component';

@Injectable()
export class SnackbarService {
    // amount of time (in ms) to wait before automatically closing the snackbar
    static DURATION: number = 4500;
    static DURATION_INFINITE: number = 0;
    static snackbarInstance: MultipleSnackbarComponent;

    /**
     * Constructor
     */
    constructor(
        private snackbar: MatSnackBar,
        private i18nService: I18nService
    ) {}

    /**
     * Show an Error Snackbar displaying the translated error message corresponding to the API Error received
     * @param err API error object
     * @param {{}} translateData
     * @param html
     * @returns {Subscription}
     */
    showApiError(
        err,
        translateData = {},
        html: boolean = false
    ) {
        const defaultApiErrorCode = 'LNG_API_ERROR_CODE_UNKNOWN_ERROR';

        // get the error message for the received API Error Code
        let apiErrorCode = _.get(err, 'code', 'UNKNOWN_ERROR');
        // add language token prefix for API Error codes
        apiErrorCode = `LNG_API_ERROR_CODE_${apiErrorCode}`;

        return this.i18nService
            .get(apiErrorCode, translateData)
            .subscribe((apiErrorMessage) => {
                if (apiErrorMessage === apiErrorCode) {
                    // translation not found; show default error message
                    return this.i18nService
                        .get(defaultApiErrorCode)
                        .subscribe((defaultErrorMessage) => {
                            this.showError(
                                defaultErrorMessage,
                                translateData,
                                html
                            );
                        });
                } else {
                    // show the error message
                    this.showError(
                        apiErrorMessage,
                        translateData,
                        html
                    );
                }
            });
    }

    /**
     * Hide message
     */
    hideMessage(
        id: string
    ) {
        if (SnackbarService.snackbarInstance) {
            SnackbarService.snackbarInstance.closeSnackbar(id);
        }
    }

    /**
     * Show a Success Snackbar
     * @param messageToken
     * @param translateData
     * @param duration
     * @param html
     * @param messageId
     */
    showSuccess(
        messageToken,
        translateData = {},
        duration = SnackbarService.DURATION,
        html: boolean = false,
        messageId?: string
    ) {
        this.i18nService
            .get(messageToken, translateData)
            .subscribe((message) => {
                this.openSnackbar(
                    message,
                    'success',
                    html,
                    duration,
                    messageId
                );
            });
    }

    /**
     * Show an Error Snackbar
     * @param messageToken
     * @param translateData
     * @param html
     * @param messageId
     */
    showError(
        messageToken,
        translateData = {},
        html: boolean = false,
        messageId?: string
    ) {
        this.i18nService
            .get(messageToken, translateData)
            .subscribe((message) => {
                this.openSnackbar(
                    message,
                    'error',
                    html,
                    null,
                    messageId
                );
            });
    }

    /**
     * Show a Notice Snackbar
     * @param messageToken
     * @param translateData
     * @param html
     * @param messageId
     */
    showNotice(
        messageToken,
        translateData = {},
        html: boolean = false,
        messageId?: string
    ) {
        this.i18nService
            .get(messageToken, translateData)
            .subscribe((message) => {
                this.openSnackbar(
                    message,
                    'notice',
                    html,
                    null,
                    messageId
                );
            });
    }

    /**
     * Open snackbar component
     */
    private openSnackbar(
        message: string,
        messageClass: string,
        html: boolean,
        duration?: number,
        messageId?: string
    ) {
        // open snackbar if we haven't already opened it
        if (!SnackbarService.snackbarInstance) {
            // show the translated message
            SnackbarService.snackbarInstance = this.snackbar.openFromComponent(MultipleSnackbarComponent, {
                panelClass: 'error',
                data: {
                    dismissSnackbar: () => { this.dismissSnackbarCallback(); }
                },
                horizontalPosition: 'center',
                verticalPosition: 'top'
            }).instance;
        }

        // add message to be displayed
        SnackbarService.snackbarInstance
            .addMessage({
                id: messageId,
                message: message,
                messageClass: messageClass,
                html: html,
                duration: duration
            });
    }

    /**
     * Close snackbar
     */
    dismissSnackbarCallback() {
        SnackbarService.snackbarInstance = undefined;
    }

    /**
     * Translate error message corresponding to the API Error received
     */
    translateApiErrors(
        errors: {
            err,
            translateData?: {},
            echo?: any
        }[]
    ) {
        // construct array of items to translate
        const observers: Observable<string>[] = [];
        (errors || []).forEach((errData) => {
            observers.push(new Observable((obs) => {
                // get the error message for the received API Error Code
                let apiErrorCode = _.get(errData.err, 'code', 'UNKNOWN_ERROR');

                // add language token prefix for API Error codes
                apiErrorCode = `LNG_API_ERROR_CODE_${apiErrorCode}`;

                // translate
                const defaultApiErrorCode = 'LNG_API_ERROR_CODE_UNKNOWN_ERROR';
                return this.i18nService
                    .get(apiErrorCode, errData.translateData)
                    .subscribe((apiErrorMessage) => {
                        if (apiErrorMessage === apiErrorCode) {
                            // translation not found; show default error message
                            return this.i18nService
                                .get(defaultApiErrorCode)
                                .subscribe((defaultErrorMessage) => {
                                    obs.next(defaultErrorMessage);
                                    obs.complete();
                                });
                        } else {
                            obs.next(apiErrorMessage);
                            obs.complete();
                        }
                    });
            }));
        });

        // execute joins in parallel
        return _.isEmpty(observers) ?
            of([]) :
            forkJoin(observers)
                .pipe(
                    map((data) => {
                        return _.map(data, (item, index) => {
                            return {
                                message: item,
                                echo: errors[index] ?
                                    errors[index].echo :
                                    null
                            };
                        });
                    })
                );
    }
}

