import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { SnackbarComponent } from '../../../shared/components/snackbar/snackbar.component';
import * as _ from 'lodash';
import { I18nService } from './i18n.service';

@Injectable()
export class SnackbarService {

    // amount of time (in ms) to wait before automatically closing the snackbar
    private duration = 4500;

    constructor(
        private snackbar: MatSnackBar,
        private i18nService: I18nService
    ) {}

    /**
     * Show a Success Snackbar
     * @param messageToken
     * @param translateData
     * @param duration
     */
    showSuccess(messageToken, translateData = {}, duration = this.duration) {
        return this.i18nService
            .get(messageToken, translateData)
            .subscribe((message) => {
                // show the translated message
                this.snackbar.openFromComponent(SnackbarComponent, {
                    panelClass: 'success',
                    data: {
                        message: message
                    },
                    duration: duration,
                    horizontalPosition: 'center',
                    verticalPosition: 'top'
                });
            });
    }

    /**
     * Show an Error Snackbar
     * @param messageToken
     * @param translateData
     * @param duration
     */
    showError(messageToken, translateData = {}, duration = this.duration) {
        return this.i18nService
            .get(messageToken, translateData)
            .subscribe((message) => {
                // show the translated message
                this.snackbar.openFromComponent(SnackbarComponent, {
                    panelClass: 'error',
                    data: {
                        message: message
                    },
                    duration: duration,
                    horizontalPosition: 'center',
                    verticalPosition: 'top'
                });
            });
    }

    /**
     * Show a Notice Snackbar
     * @param messageToken
     * @param translateData
     * @returns {MatSnackBarRef<SnackbarComponent>}
     */
    showNotice(messageToken, translateData = {}) {
        return this.i18nService
            .get(messageToken, translateData)
            .subscribe((message) => {
                // show the translated message
                this.snackbar.openFromComponent(SnackbarComponent, {
                    panelClass: 'notice',
                    data: {
                        message: message
                    },
                    horizontalPosition: 'center',
                    verticalPosition: 'top'
                });
            });
    }

    /**
     * Show an Error Snackbar displaying the translated error message corresponding to the API Error received
     * @param err API error object
     * @param {{}} translateData
     * @param {number} duration
     * @returns {Subscription}
     */
    showApiError(err, translateData = {}, duration = this.duration) {
        const defaultApiErrorCode = 'LNG_API_ERROR_CODE_UNKNOWN_ERROR';

        // get the error message for the received API Error Code
        let apiErrorCode = _.get(err, 'code', defaultApiErrorCode);
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
                            this.showError(defaultErrorMessage, duration);
                        });
                } else {
                    // show the error message
                    this.showError(apiErrorMessage, duration);
                }
            });
    }

    dismissAll() {
        this.snackbar.dismiss();
    }
}

