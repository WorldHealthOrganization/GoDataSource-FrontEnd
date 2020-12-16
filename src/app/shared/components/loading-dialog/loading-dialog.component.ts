import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { Subscriber } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { DialogComponent } from '..';

export class LoadingDialogDataModel {
    message: string;
    messageData: {
        [key: string]: string
    };
}

export class LoadingDialogModel {
    constructor(
        private subscriber: Subscriber<void>,
        private dataHandler: LoadingDialogDataModel
    ) {}

    /**
     * Close Dialog
     */
    close() {
        this.subscriber.next();
        this.subscriber.complete();
    }

    /**
     * Display message
     */
    showMessage(
        message: string,
        messageData?: {
            [key: string]: string
        }
    ) {
        this.dataHandler.message = message;
        this.dataHandler.messageData = messageData;
    }
}

@Component({
    selector: 'app-loading-dialog',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './loading-dialog.component.html',
    styleUrls: ['./loading-dialog.component.less']
})
export class LoadingDialogComponent {
    // default settings for this type of dialog
    static DEFAULT_CONFIG = {
        autoFocus: false,
        closeOnNavigation: false,
        disableClose: true,
        hasBackdrop: true,
        panelClass: 'dialog-loading-progress'
    };

    /**
     * Constructor
     */
    constructor(
        public dialogRef: MatDialogRef<DialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: LoadingDialogDataModel
    ) {}
}
