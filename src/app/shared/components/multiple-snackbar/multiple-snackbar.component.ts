import { Component, Inject, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material';
import * as _ from 'lodash';
import { DebounceTimeCaller } from '../../../core/helperClasses/debounce-time-caller';
import { Subscriber } from 'rxjs';

@Component({
    selector: 'app-multiple-snackbar',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './multiple-snackbar.component.html',
    styleUrls: ['./multiple-snackbar.component.less']
})
export class MultipleSnackbarComponent {

    // snackbar messages
    messages: {
        message: string,
        messageClass: string,
        html: boolean,
        duration: number
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

    /**
     * Add message
     */
    addMessage(message) {
        // add message to be displayed
        this.messages.push(message);
        // if message have duration time, trigger close function based on message duration
        if (message.duration) {
            // message index
            const messageIndex = _.findIndex(this.messages, message);
            // create trigger to close message for messages that have a duration do display them
            const triggerCloseMessage = new DebounceTimeCaller(new Subscriber<void>(() => {
                this.closeSnackbar(messageIndex);
            }));
            // call the closeTrigger
            triggerCloseMessage.callAfterMs(message.duration);
        }
    }

    /**
     * Close snackbar
     */
    closeSnackbar(ind) {
        // reset messages collection and dismiss snackbar if there is only one message
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
