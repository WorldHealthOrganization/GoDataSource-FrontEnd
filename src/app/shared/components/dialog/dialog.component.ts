import { Component, Inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import * as _ from 'lodash';
import { LabelValuePair } from '../../../core/models/label-value-pair';
import { NgForm } from '@angular/forms';
import { Constants } from '../../../core/models/constants';
import { Observable } from 'rxjs';
import { moment, Moment } from '../../../core/helperClasses/x-moment';
import { SafeHtml } from '@angular/platform-browser';

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

export class InfoField {
    token: string;
    value: string;
    type: DialogFieldType;

    constructor(data: {
            token: string,
            value: string,
            type: DialogFieldType,
    }) {
        this.token = data.token;
        this.value = data.value;
        this.type = data.type;
    }
}

export enum DialogFieldType {
    SELECT = 'select',
    TEXT = 'text',
    DATE_RANGE = 'date-range',
    DATE = 'date',
    BOOLEAN = 'boolean',
    LINK = 'link',
    URL = 'url',
    ACTION = 'action',
    SECTION_TITLE = 'section-title',
    INFO_SECTION_TITLE = 'info-section-title'
}

export class DialogField {
    public name: string;
    public placeholder: string;
    public inputOptions: LabelValuePair[];
    public inputOptionsMultiple: boolean = false;
    public inputOptionsClearable: boolean = true;
    public required: boolean = false;
    public min: number;
    public max: number;
    public type: string = 'text';
    public value: any;
    public visible: boolean | ((dialogFieldsValues: any) => boolean) = true;
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

    // action
    actionCallback: (actionData?: any) => void;
    actionData: any;

    constructor(data: {
        name: string,
        placeholder?: string,
        inputOptions?: LabelValuePair[],
        inputOptionsMultiple?: boolean,
        inputOptionsClearable?: boolean,
        required?: boolean,
        min?: number,
        max?: number,
        type?: string,
        value?: any,
        visible?: boolean | ((dialogFieldsValues: any) => boolean),
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
        urlAsyncErrorMsgData?: any,

        // action
        actionCallback?: (actionData?: any) => void,
        actionData?: any
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

    /**
     * Check if dialog field is visible
     * @returns {boolean|((dialogFieldsValues:any)=>boolean)}
     */
    public isVisible(dialogFieldsValues: any): boolean {
        return _.isFunction(this.visible) ?
            (this.visible as any)(dialogFieldsValues) :
            this.visible;
    }
}

export class DialogConfiguration {
    public message: string;
    public additionalInfo: string | SafeHtml;
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
    public buttons: DialogButton[];
    public addDefaultButtons: boolean = false;
    public infoExistingConfiguration: boolean = false;
    public infoFields: InfoField[] = [] ;

    // define fields
    private _fieldsList: DialogField[];
    public set fieldsList(fieldsList: DialogField[]) {
        this._fieldsList = fieldsList;
        this.updateFieldListLayoutCss();
    }
    public get fieldsList(): DialogField[] {
        return this._fieldsList;
    }

    // define fields layout
    // [25, 75, 100] => translates into two rows layout, first one has two columns ( one has 25% width, the other one has 75% width ), second one just one.
    private _fieldsListLayout: number[];
    public fieldsListLayoutCss: string[];
    public set fieldsListLayout(fieldsListLayout: number[]) {
        this._fieldsListLayout = fieldsListLayout;
        this.updateFieldListLayoutCss();
    }
    public get fieldsListLayout(): number[] {
        return this._fieldsListLayout;
    }

    constructor(data: string | {
        message: string,
        additionalInfo?: string | SafeHtml,
        yesLabel?: string,
        cancelLabel?: string,
        placeholder?: string,
        translateData?: {},
        customInput?: boolean,
        customInputOptions?: LabelValuePair[],
        customInputOptionsMultiple?: boolean,
        required?: boolean,
        fieldsList?: DialogField[],
        fieldsListLayout?: number[],
        buttons?: DialogButton[],
        addDefaultButtons?: boolean,
        yesCssClass?: string,
        cancelCssClass?: string,
        infoExistingConfiguration?: boolean
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

        // generate fields about an existing configuration
        if (this.infoExistingConfiguration) {
            this.generateInfoFields();
        }
    }

    /**
     * Update field list css
     */
    private updateFieldListLayoutCss() {
        this.fieldsListLayoutCss = [];
        _.each(this.fieldsList, (field: DialogField, index: number) => {
            this.fieldsListLayoutCss.push(
                this.fieldsListLayout &&
                this.fieldsListLayout[index] ?
                    `calc(${this.fieldsListLayout[index]}% - 20px)` :
                    'calc(100% - 20px)'
            );
        });
    }

    /**
     * Generate info fields about an existing configuration
     */
    private generateInfoFields() {
        _.each(this.fieldsList, (field: DialogField) => {
            this.infoFields.push(new InfoField({
                    token: field.placeholder,
                    value: field.value,
                    type: field.fieldType
                })
            );
        });
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
