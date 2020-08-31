import { Component, Inject, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import * as _ from 'lodash';
import { LabelValuePair } from '../../../core/models/label-value-pair';
import { NgForm } from '@angular/forms';
import { Constants } from '../../../core/models/constants';
import { Observable } from 'rxjs';
import { moment, Moment } from '../../../core/helperClasses/x-moment';
import { SafeHtml } from '@angular/platform-browser';

/**
 * Dialog Answer Constant
 */
export enum DialogAnswerButton {
    Yes = 'Yes',
    Cancel = 'Cancel',
    Extra_1 = 'Extra_1'
}

/**
 * Dialog Button
 */
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

/**
 * Dialog Answer Values
 */
export class DialogAnswerInputValue {
    constructor(public value?: any) {}
}

/**
 * Dialog Answer
 */
export class DialogAnswer {
    constructor(
        public button: DialogAnswerButton,
        public inputValue?: DialogAnswerInputValue
    ) {}
}

/**
 * Dialog Field List item
 */
export class DialogFieldListItem {
    // data
    itemData: LabelValuePair;
    disabled: boolean = false;
    actionButtonLabel: string;
    actionButtonAction: (item: DialogFieldListItem) => void;
    actionButtonActionTooltip: string;
    actionButtonDisableActionAlongWithItem: boolean = true;
    checked: boolean = false;

    /**
     * Constructor
     */
    constructor(data: {
        // required
        itemData: LabelValuePair,

        // optional
        disabled?: boolean,
        actionButtonLabel?: string,
        actionButtonAction?: (item: DialogFieldListItem) => void,
        actionButtonActionTooltip?: string,
        actionButtonDisableActionAlongWithItem?: boolean,
        checked?: boolean
    }) {
        // set properties
        Object.assign(
            this,
            data
        );
    }
}

/**
 * Dialog Field Type
 */
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
    CHECKBOX_LIST = 'checkbox-list'
}

/**
 * Dialog Field
 */
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

    // data
    data: any;

    // links
    public routerLink: string | string[];
    public queryParams: {
        [key: string]: any
    };
    public linkTarget: string;
    linkActionButtonLabel: string;
    linkActionButtonAction: (item: DialogField) => void;
    linkActionButtonActionTooltip: string;

    // url
    urlAsyncValidator: (url: string) => Observable<boolean>;
    urlAsyncErrorMsg: string;
    urlAsyncErrorMsgData: any;

    // action
    actionCallback: (actionData?: any) => void;
    actionData: any;

    // items for lists ( e.g. checkbox list )
    listItems: DialogFieldListItem[] = [];

    /**
     * Constructor
     */
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

        // data
        data?: any,

        // link
        routerLink?: string | string[],
        queryParams?: {
            [key: string]: any
        },
        linkTarget?: string,
        linkActionButtonLabel?: string,
        linkActionButtonAction?: (item: DialogField) => void,
        linkActionButtonActionTooltip?: string,

        // url
        urlAsyncValidator?: (url: string) => Observable<boolean>,
        urlAsyncErrorMsg?: string,
        urlAsyncErrorMsgData?: any,

        // action
        actionCallback?: (actionData?: any) => void,
        actionData?: any,

        // items for lists ( e.g. checkbox list )
        listItems?: DialogFieldListItem[]
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

/**
 * Dialog Configuration
 */
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

    /**
     * Constructor
     */
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
}

@Component({
    selector: 'app-dialog',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './dialog.component.html',
    styleUrls: ['./dialog.component.less']
})
export class DialogComponent implements OnDestroy {
    // default settings for this type of dialog
    static DEFAULT_CONFIG = {
        autoFocus: false,
        closeOnNavigation: true,
        disableClose: true,
        hasBackdrop: true,
        width: 'calc(100% - 100px)',
        maxWidth: '800px',
        data: undefined,
        panelClass: 'mat-dialog-main-panel'
    };

    confirmData: DialogConfiguration;
    dialogAnswerInputValue: DialogAnswerInputValue = new DialogAnswerInputValue();

    // form
    @ViewChild('form') form: NgForm;

    // used to determine data size since we can't do it with flex without a min-height
    @ViewChild('dialogMainMsg') dialogMainMsg: any;
    @ViewChild('dialogButtons') dialogButtons: any;

    // constants
    DialogFieldType = DialogFieldType;
    Constants = Constants;

    // dialog data max height
    private _timerHandler: any;
    dialogDataMaxHeight: string;

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

    /**
     * Constructor
     */
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

        // init timer handler
        this.initTimerHandler();
    }

    /**
     * Component destroyed
     */
    ngOnDestroy() {
        this.destroyTimerHandler();
    }

    /**
     * Chancel button handler
     */
    cancel(dialogHandler: MatDialogRef<DialogComponent>) {
        dialogHandler.close(new DialogAnswer(DialogAnswerButton.Cancel));
    }

    /**
     * Yes button handler
     */
    yes(
        dialogHandler: MatDialogRef<DialogComponent>,
        dialogAnswer: DialogAnswerInputValue
    ) {
        // determine list values
        const dialogAnswerClone: DialogAnswerInputValue = _.cloneDeep(dialogAnswer);
        (this.confirmData.fieldsList || []).forEach((field) => {
           if (field.fieldType === DialogFieldType.CHECKBOX_LIST) {
               dialogAnswerClone.value[field.name] = [];
               (field.listItems || []).forEach((item) => {
                   if (item.checked) {
                       dialogAnswerClone.value[field.name].push(item.itemData.value);
                   }
               });
           }
        });

        // map values
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

    /**
     * Destroy timer handler
     */
    destroyTimerHandler() {
        // nothing to destroy ?
        if (!this._timerHandler) {
            return;
        }

        // destroy timer
        clearTimeout(this._timerHandler);
        this._timerHandler = null;
    }

    /**
     * Init timer
     */
    initTimerHandler() {
        // destroy timer
        this.destroyTimerHandler();

        // handle dialog changes
        this._timerHandler = setTimeout(() => {
            this.determineDataMaxHeight();
        }, 400);
    }

    /**
     * Determine form max height
     */
    determineDataMaxHeight() {
        // prepare for next refresh
        this.initTimerHandler();

        // default max height
        this.dialogDataMaxHeight = '300px';

        // can we determine the container max height ?
        if (
            !document ||
            !document.defaultView ||
            !document.defaultView.getComputedStyle ||
            !this.dialogRef ||
            !(this.dialogRef as any)._containerInstance ||
            !(this.dialogRef as any)._containerInstance._elementRef ||
            !(this.dialogRef as any)._containerInstance._elementRef.nativeElement
        ) {
            return;
        }

        // determine parent max height
        const containerInstance = (this.dialogRef as any)._containerInstance._elementRef.nativeElement;
        const computedStyle = document.defaultView.getComputedStyle(containerInstance);
        let maxContainerInstanceMaxHeight: number;
        try {
            maxContainerInstanceMaxHeight = _.parseInt(computedStyle.getPropertyValue('max-height'));
        } catch (e) {
            maxContainerInstanceMaxHeight = 0;
        }
        let maxContainerInstancePaddingTop: number;
        try {
            maxContainerInstancePaddingTop = _.parseInt(computedStyle.getPropertyValue('padding-top'));
        } catch (e) {
            maxContainerInstancePaddingTop = 0;
        }
        let maxContainerInstancePaddingBottom: number;
        try {
            maxContainerInstancePaddingBottom = _.parseInt(computedStyle.getPropertyValue('padding-bottom'));
        } catch (e) {
            maxContainerInstancePaddingBottom = 0;
        }

        // determine how much we should substract
        const dialogMainMsgHeight: number = this.dialogMainMsg && this.dialogMainMsg.nativeElement ?
            this.dialogMainMsg.nativeElement.offsetHeight :
            0;
        const dialogMainMsgMarginBottom: number = this.dialogMainMsg && this.dialogMainMsg.nativeElement ?
            15 :
            0;
        const dialogButtonsHeight: number = this.dialogButtons && this.dialogButtons.nativeElement ?
            this.dialogButtons.nativeElement.offsetHeight :
            0;

        // do the math
        const childrenHeight: number = dialogMainMsgHeight + dialogMainMsgMarginBottom + dialogButtonsHeight;
        const heightUsed: number = maxContainerInstancePaddingTop + maxContainerInstancePaddingBottom + childrenHeight;
        this.dialogDataMaxHeight = `${maxContainerInstanceMaxHeight - heightUsed}px`;
    }
}
