import { Component, Inject, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material';
import * as _ from 'lodash';

@Component({
    selector: 'app-multiple-snackbar',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './multiple-snackbar.component.html',
    styleUrls: ['./multiple-snackbar.component.less']
})
export class MultipleSnackbarComponent {

    // error messages
    messages: {
        message: string,
        messageClass: string,
        html: boolean
    }[] = [];

    // available themes: 'success', 'error'
    theme: string;

    /**
     * Constructor
     */
    constructor(
        @Inject(MAT_SNACK_BAR_DATA) public data: any,
        public snackBarRef: MatSnackBarRef<MultipleSnackbarComponent>
    ) {
        this.theme = _.get(data, 'theme');
    }

    addMessage(message) {
        console.log('push message');
        console.log(message);
        this.messages.push(message);
    }

    /**
     * Close snackbar
     */
    closeSnackbar(ind) {
        // reset error messages collection and dismiss snackbar if there is only one message
        if (this.messages.length === 1) {
            this.closeAllSnackbars();
        } else {
            // close message
            this.messages = this.messages.filter((msg, index) => {
                return index !== ind ? msg : '';
            });
        }
    }

    /**
     * Close all snackbars
     */
    closeAllSnackbars() {
        this.messages = [];
        this.data.dismissSnackbar();
        this.snackBarRef.dismiss();
    }
}
