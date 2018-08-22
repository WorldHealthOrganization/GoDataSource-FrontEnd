import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import * as _ from 'lodash';
import { LabelValuePair } from '../../../core/models/label-value-pair';

export enum DialogAnswerButton {
    Yes = 'Yes',
    Cancel = 'Cancel',
}

export class DialogAnswerInputValue {
    constructor(public value?: number) {
    }
}

export class DialogAnswer {
    constructor(public button: DialogAnswerButton,
                public inputValue?: DialogAnswerInputValue) {
    }
}

export class DialogConfiguration {
    constructor(public message: string,
                public yesLabel?: string,
                public cancelLabel?: string,
                public placeholder?: string,
                public translateData?: {},
                public customInput?: boolean,
                public required?: boolean,
                public data?: LabelValuePair[]) {
        // default values since we can't do this from the parameters
        if (!yesLabel) {
            this.yesLabel = 'LNG_DIALOG_CONFIRM_BUTTON_YES';
        }
        if (!cancelLabel) {
            this.cancelLabel = 'LNG_DIALOG_CONFIRM_BUTTON_CANCEL';
        }
        if (!placeholder) {
            this.placeholder = 'LNG_DIALOG_CONFIRM_FIELD_LABEL';
        }
        if (!translateData) {
            this.translateData = {};
        }
    }
}

@Component({
    selector: 'app-dialog',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './dialog.component.html',
    styleUrls: ['./dialog.component.less']
})
export class DialogComponent {
    // default settings for this type of dialog
    static DEFAULT_CONFIG = {
        autoFocus: true,
        closeOnNavigation: true,
        disableClose: true,
        hasBackdrop: true,
        width: '600px',
        maxWidth: '600px',
        data: undefined
    };

    confirmData: DialogConfiguration;
    dialogAnswerInputValue: DialogAnswerInputValue = new DialogAnswerInputValue();

    /**
     * Default configs with provided data
     * @param {DialogConfiguration | string} data
     * @returns {any}
     */
    static defaultConfigWithData(data?: DialogConfiguration | string) {
        // no data provided
        if (!data) {
            return DialogComponent.DEFAULT_CONFIG;
        }

        // do we need to initialize data ?
        const configs = _.cloneDeep(DialogComponent.DEFAULT_CONFIG);
        if (_.isString(data)) {
            configs.data = new DialogConfiguration(data as string);
        } else {
            configs.data = data as DialogConfiguration;
        }

        // finished
        return configs;

    }

    constructor(private dialogRef: MatDialogRef<DialogComponent>,
                @Inject(MAT_DIALOG_DATA) private data: DialogConfiguration) {
        // set confirm data
        this.confirmData = data;
    }

    cancel() {
        this.dialogRef.close(new DialogAnswer(DialogAnswerButton.Cancel));
    }

    yes() {
        this.dialogRef.close(new DialogAnswer(DialogAnswerButton.Yes, this.dialogAnswerInputValue));
    }

}
