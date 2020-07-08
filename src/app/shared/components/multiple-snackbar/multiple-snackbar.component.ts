import { Component, Inject, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material';
import { DebounceTimeCaller } from '../../../core/helperClasses/debounce-time-caller';
import { Subscriber } from 'rxjs';
import { v4 as uuid } from 'uuid';

@Component({
    selector: 'app-multiple-snackbar',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './multiple-snackbar.component.html',
    styleUrls: ['./multiple-snackbar.component.less']
})
export class MultipleSnackbarComponent implements OnDestroy {

    // snackbar messages
    messages: {
        id?: string,
        message: string,
        messageClass: string,
        html: boolean,
        duration: number,
        messageDurationHandler: DebounceTimeCaller
    }[] = [];

    /**
     * Constructor
     */
    constructor(
        @Inject(MAT_SNACK_BAR_DATA) public data: any,
        public snackBarRef: MatSnackBarRef<MultipleSnackbarComponent>
    ) {}

    /**
     * Add message
     */
    addMessage(message) {
        // if we've already pushed this static message, do not push again the message
        if (
            message.id &&
            this.messages.find(msg => {
                return msg.id === message.id;
            })
        ) {
            return;
        } else {
            // assign unique id to message if it doesn't have one
            if (!message.id) {
                Object.assign(message, {id: uuid()});
            }
            // add message to be displayed
            this.messages.push(message);
            // if message have duration time, trigger close function based on message duration
            if (message.duration) {
                // create trigger to close message for messages that have a duration do display them
                message.messageDurationHandler = new DebounceTimeCaller(new Subscriber<void>(() => {
                    this.closeSnackbar(message.id);
                }));
                // call the closeTrigger
                message.messageDurationHandler.callAfterMs(message.duration);
            }
        }
    }

    /**
     * Close snackbar
     */
    closeSnackbar(id) {
        // find message index
        const index: number = this.messages.findIndex(msg => msg.id === id);
        if (index > -1) {
            // if message has duration unsubscribe debounce time caller
            if (this.messages[index].messageDurationHandler) {
                this.messages[index].messageDurationHandler.unsubscribe();
                this.messages[index].messageDurationHandler = undefined;
            }

            // remove specific message
            this.messages = this.messages.filter((msg) => {
                return msg.id !== id;
            });
        }

        // dismiss all snackbars
        if (this.messages.length < 1) {
            this.closeAllSnackbars();
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

    /**
     * Component destroyed
     */
    ngOnDestroy(): void {
        // unsubscribe for each message if it has a duration handled
        this.messages.forEach((message) => {
            if (message.messageDurationHandler) {
                message.messageDurationHandler.unsubscribe();
                message.messageDurationHandler = undefined;
            }
        });
    }
}
