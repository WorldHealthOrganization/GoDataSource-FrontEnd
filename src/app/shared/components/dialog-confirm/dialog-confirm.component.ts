import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import * as _ from 'lodash';

export enum DialogConfirmAnswer {
    Yes = 'Yes',
    Cancel = 'Cancel'
}

export class DialogConfirmData {
    constructor(
        public message: string,
        public yesLabel?: string,
        public cancelLabel?: string,
        public translateData?: {}
    ) {
        // default values since we can't do this from the parameters
        if (!yesLabel) { this.yesLabel = 'LNG_DIALOG_CONFIRM_BUTTON_YES'; }
        if (!cancelLabel) { this.cancelLabel = 'LNG_DIALOG_CONFIRM_BUTTON_CANCEL'; }
        if (!translateData) { this.translateData = {}; }
    }
}

@Component({
    selector: 'app-dialog-confirm',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './dialog-confirm.component.html',
    styleUrls: ['./dialog-confirm.component.less']
})
export class DialogConfirmComponent {
    // default settings for this type of dialog
    static DEFAULT_CONFIG = {
        autoFocus: true,
        closeOnNavigation: true,
        disableClose: true,
        hasBackdrop: true,
        width: '600px',
        maxWidth: '600px'
    };

    confirmData: DialogConfirmData;

    /**
     * Default configs with provided data
     * @param {DialogConfirmData | string} data
     * @returns {any}
     */
    static defaultConfigWithData(data?: DialogConfirmData | string) {
        // no data provided
        if (!data) {
            return DialogConfirmComponent.DEFAULT_CONFIG;
        }

        // do we need to initialize data ?
        const configs = _.cloneDeep(DialogConfirmComponent.DEFAULT_CONFIG);
        if (_.isString(data)) {
            configs.data = new DialogConfirmData(data as string);
        } else {
            configs.data = data as DialogConfirmData;
        }

        // finished
        return configs;
    }

    constructor(
        private dialogRef: MatDialogRef<DialogConfirmComponent>,
        @Inject(MAT_DIALOG_DATA) private data: DialogConfirmData
    ) {
        this.confirmData = data;
    }

    cancel() {
        this.dialogRef.close(DialogConfirmAnswer.Cancel);
    }

    yes() {
        this.dialogRef.close(DialogConfirmAnswer.Yes);
    }
}
