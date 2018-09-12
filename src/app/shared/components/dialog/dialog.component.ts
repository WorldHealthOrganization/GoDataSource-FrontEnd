import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import * as _ from 'lodash';
import { LabelValuePair } from '../../../core/models/label-value-pair';

export enum DialogAnswerButton {
    Yes = 'Yes',
    Cancel = 'Cancel',
}

export class DialogAnswerInputValue {
    constructor(public value?: any) {}
}

export class DialogAnswer {
    constructor(
        public button: DialogAnswerButton,
        public inputValue?: DialogAnswerInputValue
    ) {}
}

export class DialogField {
    public name: string;
    public placeholder: string;
    public inputOptions: LabelValuePair[];
    public inputOptionsMultiple: boolean = false;
    public required: boolean = false;
    public type: string = 'text';
    public requiredOneOfTwo: string;

    constructor(data: {
        name: string,
        placeholder: string,
        inputOptions?: LabelValuePair[],
        inputOptionsMultiple?: boolean,
        required?: boolean,
        type?: string,
        requiredOneOfTwo?: string
    }) {
        Object.assign(
            this,
            data
        );
    }
}

export class DialogConfiguration {
    public message: string;
    public yesLabel: string = 'LNG_DIALOG_CONFIRM_BUTTON_YES';
    public cancelLabel: string = 'LNG_DIALOG_CONFIRM_BUTTON_CANCEL';
    public placeholder: string = 'LNG_DIALOG_CONFIRM_FIELD_LABEL';
    public translateData: {} = {};
    public customInput: boolean = false;
    public customInputOptions: LabelValuePair[];
    public customInputOptionsMultiple: boolean = false;
    public required: boolean = false;
    public data: LabelValuePair[];
    public fieldsList: DialogField[];

    constructor(data: string | {
        message: string,
        yesLabel?: string,
        cancelLabel?: string,
        placeholder?: string,
        translateData?: {},
        customInput?: boolean,
        customInputOptions?: LabelValuePair[],
        customInputOptionsMultiple?: boolean,
        required?: boolean,
        data?: LabelValuePair[],
        fieldsList?: DialogField[]
    }) {
        // assign properties
        if (_.isString(data)) {
            this.message = data as string;
        } else {
            // assign properties
            Object.assign(
                this,
                data
            );
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

    constructor(
        private dialogRef: MatDialogRef<DialogComponent>,
        @Inject(MAT_DIALOG_DATA) private data: DialogConfiguration
    ) {
        // set confirm data
        this.confirmData = data;

        // if we've assigned field lists then we need an object to keep properties
        if (!_.isEmpty(this.confirmData.fieldsList)) {
            this.dialogAnswerInputValue.value = {};
        }
    }

    cancel() {
        this.dialogRef.close(new DialogAnswer(DialogAnswerButton.Cancel));
    }

    yes() {
        this.dialogRef.close(new DialogAnswer(DialogAnswerButton.Yes, this.dialogAnswerInputValue));
    }

}
