import { Component, Inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import * as _ from 'lodash';
import { LabelValuePair } from '../../../core/models/label-value-pair';
import { NgForm } from '@angular/forms';
import { Constants } from '../../../core/models/constants';
import * as moment from 'moment';
import { Moment } from 'moment';
import { Observable } from 'rxjs/Observable';

export enum DialogAnswerButton {
    Yes = 'Yes',
    Cancel = 'Cancel',
    Extra_1 = 'Extra_1'
}

export class DialogButton {
    // required
    label: string;
    clickCallback: (
        dialogHandler: MatDialogRef<DialogComponent>,
        dialogAnswer: DialogAnswerInputValue
    ) => void;

    // optional
    cssClass: string;
    disabled: () => boolean = () => false;

    /**
     * Constructor
     */
    constructor(data: {
        // required
        label: string,
        clickCallback: (
            dialogHandler: MatDialogRef<DialogComponent>,
            dialogAnswer: DialogAnswerInputValue
        ) => void

        // optional
        cssClass?: string,
        disabled?: () => boolean
    }) {
        // assign properties
        Object.assign(
            this,
            data
        );
    }
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

export enum DialogFieldType {
    SELECT = 'select',
    TEXT = 'text',
    DATE_RANGE = 'date-range',
    DATE = 'date',
    BOOLEAN = 'boolean',
    LINK = 'link',
    URL = 'url'
}

export class DialogField {
    public name: string;
    public placeholder: string;
    public inputOptions: LabelValuePair[];
    public inputOptionsMultiple: boolean = false;
    public inputOptionsClearable: boolean = true;
    public required: boolean = false;
    public type: string = 'text';
    public requiredOneOfTwo: string;
    public value: any;
    public disabled: boolean = false;
    public description: string;
    public fieldType: DialogFieldType = DialogFieldType.TEXT;

    // links
    public routerLink: string | string[];
    public queryParams: {
        [key: string]: any
    };
    public linkTarget: string;

    // url
    urlAsyncValidator: (url: string) => Observable<boolean>;
    urlAsyncErrorMsg: string;
    urlAsyncErrorMsgData: any;

    constructor(data: {
        name: string,
        placeholder?: string,
        inputOptions?: LabelValuePair[],
        inputOptionsMultiple?: boolean,
        inputOptionsClearable?: boolean,
        required?: boolean,
        type?: string,
        requiredOneOfTwo?: string,
        value?: any,
        disabled?: boolean,
        description?: string,
        fieldType?: DialogFieldType,

        // link
        routerLink?: string | string[],
        queryParams?: {
            [key: string]: any
        },
        linkTarget?: string,

        // url
        urlAsyncValidator?: (url: string) => Observable<boolean>,
        urlAsyncErrorMsg?: string,
        urlAsyncErrorMsgData?: any
    }) {
        // set properties
        Object.assign(
            this,
            data
        );

        // force select type
        if (this.inputOptions !== undefined) {
            this.fieldType = DialogFieldType.SELECT;
        }
    }
}

export class DialogConfiguration {
    public message: string;
    public yesLabel: string = 'LNG_DIALOG_CONFIRM_BUTTON_YES';
    public yesCssClass: string;
    public cancelLabel: string = 'LNG_DIALOG_CONFIRM_BUTTON_CANCEL';
    public cancelCssClass: string;
    public placeholder: string = 'LNG_DIALOG_CONFIRM_FIELD_LABEL';
    public translateData: {} = {};
    public customInput: boolean = false;
    public customInputOptions: LabelValuePair[];
    public customInputOptionsMultiple: boolean = false;
    public required: boolean = false;
    public data: LabelValuePair[];
    public fieldsList: DialogField[];
    public buttons: DialogButton[];
    public addDefaultButtons: boolean = false;

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
        fieldsList?: DialogField[],
        buttons?: DialogButton[],
        addDefaultButtons?: boolean,
        yesCssClass?: string,
        cancelCssClass?: string
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
        autoFocus: false,
        closeOnNavigation: true,
        disableClose: true,
        hasBackdrop: true,
        width: '600px',
        maxWidth: '600px',
        data: undefined
    };

    confirmData: DialogConfiguration;
    dialogAnswerInputValue: DialogAnswerInputValue = new DialogAnswerInputValue();

    @ViewChild('form') form: NgForm;

    // constants
    DialogFieldType = DialogFieldType;
    Constants = Constants;

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
        public dialogRef: MatDialogRef<DialogComponent>,
        @Inject(MAT_DIALOG_DATA) private data: DialogConfiguration
    ) {
        // set confirm data
        this.confirmData = data;

        // no dialog buttons provided, assign default ones ?
        if (
            _.isEmpty(this.confirmData.buttons) ||
            this.confirmData.addDefaultButtons
        ) {
            this.confirmData.buttons = [
                // add default buttons
                new DialogButton({
                    clickCallback: (
                        dialogHandler: MatDialogRef<DialogComponent>
                    ) => { this.cancel(dialogHandler); },
                    label: this.confirmData.cancelLabel,
                    cssClass: this.confirmData.cancelCssClass
                }),
                new DialogButton({
                    disabled: (): boolean => {
                        return this.confirmData.customInput &&
                            this.form &&
                            this.form.invalid;
                    },
                    clickCallback: (
                        dialogHandler: MatDialogRef<DialogComponent>,
                        dialogAnswer: DialogAnswerInputValue
                    ) => { this.yes(dialogHandler, dialogAnswer); },
                    label: this.confirmData.yesLabel,
                    cssClass: this.confirmData.yesCssClass
                }),

                // add extra buttons
                ...(this.confirmData.buttons ? this.confirmData.buttons : [])
            ];
        }

        // if we've assigned field lists then we need an object to keep properties
        if (!_.isEmpty(this.confirmData.fieldsList)) {
            // value needs to be an object to accommodate all fields
            this.dialogAnswerInputValue.value = {};

            // put default values
            _.each(this.confirmData.fieldsList, (field: DialogField) => {
                // any other value is allowed, this is why we don't use _.isEmpty
                if (
                    field.value !== null &&
                    field.value !== undefined
                ) {
                    this.dialogAnswerInputValue.value[field.name] = field.value;
                }
            });
        }
    }

    cancel(dialogHandler: MatDialogRef<DialogComponent>) {
        dialogHandler.close(new DialogAnswer(DialogAnswerButton.Cancel));
    }

    yes(
        dialogHandler: MatDialogRef<DialogComponent>,
        dialogAnswer: DialogAnswerInputValue
    ) {
        // map values
        const dialogAnswerClone: DialogAnswerInputValue = _.cloneDeep(dialogAnswer);
        if (_.isObject(dialogAnswerClone.value)) {
            _.each(dialogAnswerClone.value, (value, prop) => {
                delete dialogAnswerClone.value[prop];
                _.set(dialogAnswerClone, `value[${prop}]`, value);
            });
        }

        // send answer
        dialogHandler.close(new DialogAnswer(DialogAnswerButton.Yes, dialogAnswerClone));
    }

    /**
     * Set date value
     * @param fieldName
     * @param value
     */
    setDateValue(
        fieldName: string,
        value: Moment
    ) {
        this.dialogAnswerInputValue.value[fieldName] = value ? moment(value).toISOString() : value;
    }
}
