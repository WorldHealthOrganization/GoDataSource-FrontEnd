import { ElementRef, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import {
    DialogAnswer, DialogAnswerButton,
    DialogComponent,
    DialogConfiguration, DialogField
} from '../../../shared/components/dialog/dialog.component';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { LabelValuePair } from '../../models/label-value-pair';
import { ImportExportDataService } from '../data/import-export.data.service';
import { SnackbarService } from './snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';

export enum ExportDataExtension {
    CSV = 'csv',
    XLS = 'xls',
    XLSX = 'xlsx',
    XML = 'xml',
    ODS = 'ods',
    JSON = 'json',
    PDF = 'pdf'
}

@Injectable()
export class DialogService {

    /**
     * Constructor
     * @param dialog
     */
    constructor(
        private dialog: MatDialog,
        private importExportDataService: ImportExportDataService,
        private snackbarService: SnackbarService,
    ) {}

    /**
     * Show a Confirm Dialog
     * @param {DialogConfiguration | string} messageToken - Can be either a message ( string ) or an object of type DialogConfiguration
     * @param {{}} translateData
     * @returns {Observable<DialogAnswer>}
     */
    showConfirm(
        messageToken: DialogConfiguration | string,
        translateData = {}
    ): Observable<DialogAnswer> {
        // construct dialog message data
        const dialogMessage = DialogComponent.defaultConfigWithData(messageToken);
        (dialogMessage.data as DialogConfiguration).translateData = translateData;

        // open dialog
        return this.dialog.open(
            DialogComponent,
            dialogMessage
        ).afterClosed();
    }

    /**
     * Show o custom dialog with an input
     * @param {DialogConfiguration | string} messageToken
     * @param {boolean} required
     * @param {{}} translateData
     * @returns {Observable<DialogAnswer>}
     */
    showInput(
        messageToken: DialogConfiguration | string,
        required: boolean = true,
        translateData = {}
    ): Observable<DialogAnswer> {
        // create input dialog configuration
        let dialogConf: DialogConfiguration = null;
        if (_.isString(messageToken)) {
            dialogConf = new DialogConfiguration({
                message: messageToken as string,
                translateData: translateData,
                customInput: true,
                required: required
            });
        } else {
            dialogConf = messageToken as DialogConfiguration;
            dialogConf.required = required;
            dialogConf.customInput = true;
            dialogConf.translateData = Object.keys(translateData).length > 0 ? translateData : dialogConf.translateData;
        }

        // construct dialog message data
        const dialogMessage = DialogComponent.defaultConfigWithData(dialogConf);

        // open dialog
        return this.dialog.open(
            DialogComponent,
            dialogMessage
        ).afterClosed();
    }

    /**
     * Show a dialog containing data - array of objects with label and value
     * @param {any[]} data
     * @returns {Observable<DialogAnswer>}
     */
    showDataDialog(data: LabelValuePair[]): Observable<DialogAnswer> {
        // construct dialog message data
        const dialogConfig = new DialogConfiguration({
            message: '',
            data: data
        });
        const dialogComp = DialogComponent.defaultConfigWithData(dialogConfig);

        // open dialog
        return this.dialog.open(
            DialogComponent,
            dialogComp
        ).afterClosed();
    }

    /**
     * Show export data dialog
     */
    showExportDialog(data: {
        // required
        message: string,
        url: string,
        fileName: string,
        buttonDownloadFile: ElementRef,

        // optional
        extensionPlaceholder?: string,
        allowedExportTypes?: ExportDataExtension[],
        displayEncrypt?: boolean,
        encryptPlaceholder?: string,
        displayAnonymize?: boolean,
        anonymizePlaceholder?: string,
        anonymizeFields?: LabelValuePair[],
        yesLabel?: string,
        queryBuilder?: RequestQueryBuilder
    }) {
        // default values
        if (!data.extensionPlaceholder) {
            data.extensionPlaceholder = 'LNG_COMMON_LABEL_EXPORT_TYPE';
        }
        if (_.isEmpty(data.allowedExportTypes)) {
            data.allowedExportTypes = [
                ExportDataExtension.CSV,
                ExportDataExtension.XLS,
                ExportDataExtension.XLSX,
                ExportDataExtension.XML,
                ExportDataExtension.ODS,
                ExportDataExtension.JSON
            ];
        }
        if (!data.encryptPlaceholder) {
            data.encryptPlaceholder = 'LNG_COMMON_LABEL_EXPORT_ENCRYPT_PASSWORD';
        }
        if (!data.anonymizePlaceholder) {
            data.anonymizePlaceholder = 'LNG_COMMON_LABEL_EXPORT_ANONYMIZE_FIELDS';
        }
        if (!data.yesLabel) {
            data.yesLabel = 'LNG_COMMON_LABEL_EXPORT';
        }

        // construct list of inputs that we need in the dialog
        const fieldsList: DialogField[] = [
            new DialogField({
                name: 'fileType',
                placeholder: data.extensionPlaceholder,
                inputOptions: _.map(data.allowedExportTypes, (item: ExportDataExtension) => {
                    return new LabelValuePair(
                        item as string,
                        item as string
                    );
                }),
                inputOptionsMultiple: false,
                required: true
            })
        ];

        // add encrypt password
        if (data.displayEncrypt) {
            fieldsList.push(
                new DialogField({
                    name: 'encryptPassword',
                    placeholder: data.encryptPlaceholder,
                    requiredOneOfTwo: 'anonymizeFields'
                })
            );
        }

        // add encrypt anonymize fields
        if (data.displayAnonymize) {
            fieldsList.push(
                new DialogField({
                    name: 'anonymizeFields',
                    placeholder: data.anonymizePlaceholder,
                    inputOptions: data.anonymizeFields,
                    inputOptionsMultiple: true,
                    requiredOneOfTwo: 'encryptPassword'
                })
            );
        }

        // display dialog
        this.showInput(new DialogConfiguration({
                message: data.message,
                yesLabel: data.yesLabel,
                fieldsList: fieldsList
            }))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.importExportDataService
                        .exportData(
                            data.url,
                            answer.inputValue.value,
                            data.queryBuilder
                        ).catch((err) => {
                        this.snackbarService.showError('LNG_COMMON_LABEL_EXPORT_ERROR');
                        return ErrorObservable.create(err);
                    }).subscribe((blob) => {
                        const urlT = window.URL.createObjectURL(blob);

                        const link = data.buttonDownloadFile.nativeElement;
                        link.href = urlT;
                        link.download = `${data.fileName}.${answer.inputValue.value.fileType}`;
                        link.click();

                        window.URL.revokeObjectURL(urlT);
                    });
                }
            });
    }
}
