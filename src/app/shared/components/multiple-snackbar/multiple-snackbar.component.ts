import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material';
import { SnackbarHelperService } from '../../../core/services/helper/snackbar-helper.service';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-multiple-snackbar',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './multiple-snackbar.component.html',
    styleUrls: ['./multiple-snackbar.component.less']
})
export class MultipleSnackbarComponent implements OnInit, OnDestroy {

    // error messages
    errors: {message: string, messageClass: string}[] = [];

    // available themes: 'success', 'error'
    theme: string;
    html: boolean;

    private errorSubscription: Subscription;

    constructor(
        @Inject(MAT_SNACK_BAR_DATA) public data: any[],
        public snackBarRef: MatSnackBarRef<MultipleSnackbarComponent>,
        public snackbarHelperService: SnackbarHelperService
    ) {
        this.theme = _.get(data, 'theme');
        this.html = _.get(data, 'html');
    }

    ngOnInit() {
        // reset errors
        this.errors = [];
        // get message to display
        this.errorSubscription = this.snackbarHelperService.errorSubject.subscribe((message) => {
            this.errors.push(message);
        });
    }

    /**
     * Close snackbar
     */
    closeSnackbar(ind) {
        // reset error messages collection and dismiss snackbar if there is only one message
        if (this.errors.length === 1) {
            this.closeAllSnackbars();
        } else {
            // close message
            this.errors = this.errors.filter((err, index) => {
                return index !== ind ? err : '';
            });
        }
    }

    /**
     * Close all snackbars
     */
    closeAllSnackbars() {
        this.errors = [];
        this.snackbarHelperService.snackbarsOpenedSubject.next(false);
        this.snackBarRef.dismiss();
    }

    ngOnDestroy(): void {
        this.errorSubscription.unsubscribe();
    }
}
