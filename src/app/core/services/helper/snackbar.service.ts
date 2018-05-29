import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';

import { SnackbarComponent } from '../../../shared/components/snackbar/snackbar.component';

@Injectable()
export class SnackbarService {

    // amount of time (in ms) to wait before automatically closing the snackbar
    private duration = 4500;

    constructor(
        private snackbar: MatSnackBar
    ) {}

    /**
     * Show a Success Snackbar
     * @param message
     * @param duration
     * @returns {MatSnackBarRef<SnackbarComponent>}
     */
    showSuccess(message, duration = this.duration) {
        return this.snackbar.openFromComponent(SnackbarComponent, {
            panelClass: 'success',
            data: {
                message: message
            },
            duration: duration
        });
    }

    /**
     * Show an Error Snackbar
     * @param message
     * @param duration
     * @returns {MatSnackBarRef<SnackbarComponent>}
     */
    showError(message, duration = this.duration) {
        return this.snackbar.openFromComponent(SnackbarComponent, {
            panelClass: 'error',
            data: {
                message: message
            },
            duration: duration
        });
    }
}

