import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
    DialogAnswer, DialogAnswerButton,
    DialogComponent,
    DialogConfiguration, DialogField, DialogFieldType
} from '../../../shared/components/dialog/dialog.component';
import { Observable, Subscriber } from 'rxjs';
import * as _ from 'lodash';
import { LabelValuePair } from '../../models/label-value-pair';
import { ImportExportDataService } from '../data/import-export.data.service';
import { SnackbarService } from './snackbar.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import * as FileSaver from 'file-saver';
import { LoadingDialogComponent, LoadingDialogDataModel, LoadingDialogModel } from '../../../shared/components/loading-dialog/loading-dialog.component';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { IExportFieldsGroupRequired } from '../../../core/models/export-fields-group.model';
import { ExportLogDataService } from '../data/export-log.data.service';
import { Constants, ExportStatusStep } from '../../models/constants';
import { Moment } from 'moment';
import * as moment from 'moment';

export enum ExportDataExtension {
    CSV = 'csv',
    XLS = 'xls',
    XLSX = 'xlsx',
    XML = 'xml',
    ODS = 'ods',
    JSON = 'json',
    PDF = 'pdf',
    ZIP = 'zip',
    QR = 'qr'
}

export interface IAsyncExportResponse {
    exportLogId: string;
}

@Injectable()
export class DialogService {
    /**
     * Constructor
     */
    constructor(
        private dialog: MatDialog,
        private importExportDataService: ImportExportDataService,
        private snackbarService: SnackbarService,
        private exportLogDataService: ExportLogDataService
    ) {}

    /**
     * Show a Confirm Dialog
     * @param {DialogConfiguration | string} messageToken - Can be either a message ( string ) or an object of type DialogConfiguration
     * @param {{}} translateData
     * @returns {Observable<DialogAnswer>}
     */
    showConfirmDialog(
        messageToken: DialogConfiguration | string,
        translateData = {}
    ): MatDialogRef<DialogComponent> {
        // construct dialog message data
        const dialogMessage = DialogComponent.defaultConfigWithData(messageToken);
        (dialogMessage.data as DialogConfiguration).translateData = translateData;

        // open dialog
        return this.dialog.open(
            DialogComponent,
            dialogMessage
        );
    }

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
        return this
            .showConfirmDialog(
                messageToken,
                translateData
            )
            .afterClosed();
    }

    /**
     * Show o custom dialog with an input
     * @param {DialogConfiguration | string} messageToken
     * @param {boolean} required
     * @param {{}} translateData
     * @returns {Observable<DialogAnswer>}
     */
    showInputDialog(
        messageToken: DialogConfiguration | string,
        required: boolean = true,
        translateData = {}
    ): MatDialogRef<DialogComponent> {
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
        );
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
        return this.showInputDialog(
            messageToken,
            required,
            translateData
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

        // optional
        isAsyncExport?: boolean,
        exportProgress?: (
            step: ExportStatusStep,
            processed: number,
            total: number,
            estimatedEndDate: Moment
        ) => void,
        exportStart?: () => void,
        exportFinished?: (answer: DialogAnswer) => void,
        extensionPlaceholder?: string,
        fileType?: ExportDataExtension,
        allowedExportTypes?: ExportDataExtension[],
        allowedExportTypesKey?: string,
        displayEncrypt?: boolean,
        encryptPlaceholder?: string,
        displayAnonymize?: boolean,
        displayFieldsGroupList?: boolean,
        anonymizeFieldsKey?: string,
        anonymizePlaceholder?: string,
        fieldsGroupAllPlaceholder?: string,
        fieldsGroupListPlaceholder?: string,
        anonymizeFields?: LabelValuePair[],
        fieldsGroupList?: LabelValuePair[],
        fieldsGroupListRequired?: IExportFieldsGroupRequired,
        displayUseQuestionVariable?: boolean,
        useQuestionVariablePlaceholder?: string,
        useQuestionVariableDescription?: string,
        displayUseDbColumns?: boolean,
        useDbColumnsPlaceholder?: string,
        useDbColumnsDescription?: string,
        useDbColumnsDontTranslateValuePlaceholder?: string,
        useDbColumnsDontTranslateValueDescription?: string,
        yesLabel?: string,
        queryBuilder?: RequestQueryBuilder,
        queryBuilderClearOthers?: string[],
        extraAPIData?: {
            [key: string]: any
        },
        isPOST?: boolean,
        extraDialogFields?: DialogField[],
        fileExtension?: string
    }) {
        // default values
        if (!data.extensionPlaceholder) {
            data.extensionPlaceholder = 'LNG_COMMON_LABEL_EXPORT_TYPE';
        }
        if (data.fileType) {
            data.allowedExportTypes = [data.fileType];
        } else {
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
        }
        if (!data.encryptPlaceholder) {
            data.encryptPlaceholder = 'LNG_COMMON_LABEL_EXPORT_ENCRYPT_PASSWORD';
        }

        if (!data.useQuestionVariablePlaceholder) {
            data.useQuestionVariablePlaceholder = 'LNG_COMMON_LABEL_EXPORT_USE_QUESTION_VARIABLE';
        }

        if (!data.useQuestionVariableDescription) {
            data.useQuestionVariableDescription = 'LNG_COMMON_LABEL_EXPORT_USE_QUESTION_VARIABLE_DESCRIPTION';
        }

        if (!data.useDbColumnsPlaceholder) {
            data.useDbColumnsPlaceholder = 'LNG_COMMON_LABEL_EXPORT_USE_DB_COLUMNS';
        }

        if (!data.useDbColumnsDescription) {
            data.useDbColumnsDescription = 'LNG_COMMON_LABEL_EXPORT_USE_DB_COLUMNS_DESCRIPTION';
        }

        if (!data.useDbColumnsDontTranslateValuePlaceholder) {
            data.useDbColumnsDontTranslateValuePlaceholder = 'LNG_COMMON_LABEL_EXPORT_USE_DB_COLUMNS_NO_TRANSLATED_VALUES';
        }

        if (!data.useDbColumnsDontTranslateValueDescription) {
            data.useDbColumnsDontTranslateValueDescription = 'LNG_COMMON_LABEL_EXPORT_USE_DB_COLUMNS_NO_TRANSLATED_VALUES_DESCRIPTION';
        }

        if (!data.anonymizePlaceholder) {
            data.anonymizePlaceholder = 'LNG_COMMON_LABEL_EXPORT_ANONYMIZE_FIELDS';
        }

        if (!data.fieldsGroupAllPlaceholder) {
            data.fieldsGroupAllPlaceholder = 'LNG_COMMON_LABEL_EXPORT_FIELDS_GROUPS_ALL';
        }

        if (!data.fieldsGroupListPlaceholder) {
            data.fieldsGroupListPlaceholder = 'LNG_COMMON_LABEL_EXPORT_FIELDS_GROUPS';
        }

        if (!data.yesLabel) {
            data.yesLabel = 'LNG_COMMON_LABEL_EXPORT';
        }
        if (_.isEmpty(data.queryBuilderClearOthers)) {
            data.queryBuilderClearOthers = [
                'childrenQueryBuilders',
                'includedRelations',
                'filter',
                'sort',
                'deleted'
            ];
        }

        // default extra api data
        if (!data.extraAPIData) {
            data.extraAPIData = {};
        }

        // check if we have a different export type key
        if (!data.allowedExportTypesKey) {
            data.allowedExportTypesKey = 'fileType';
        }

        // construct list of inputs that we need in the dialog
        const fieldsListLayout: number[] = [40];
        let fieldsList: DialogField[] = [
            new DialogField({
                name: data.allowedExportTypesKey,
                placeholder: data.extensionPlaceholder,
                inputOptions: _.map(data.allowedExportTypes, (item: ExportDataExtension) => {
                    return new LabelValuePair(
                        item as string,
                        item as string
                    );
                }),
                inputOptionsMultiple: false,
                required: true,
                value: data.fileType ? data.fileType : null,
                disabled: !!data.fileType
            })
        ];

        // add encrypt password
        if (data.displayEncrypt) {
            fieldsListLayout.push(60);
            fieldsList.push(
                new DialogField({
                    name: 'encryptPassword',
                    placeholder: data.encryptPlaceholder
                })
            );
        }

        // check if we have a different anonymize key
        if (!data.anonymizeFieldsKey) {
            data.anonymizeFieldsKey = 'anonymizeFields';
        }

        // add encrypt anonymize fields
        if (data.displayAnonymize) {
            fieldsListLayout.push(100);
            fieldsList.push(
                new DialogField({
                    name: data.anonymizeFieldsKey,
                    placeholder: data.anonymizePlaceholder,
                    inputOptions: data.anonymizeFields,
                    inputOptionsMultiple: true
                })
            );
        }

        // add export fields Groups
        if (data.displayFieldsGroupList) {
            fieldsListLayout.push(100);
            fieldsList.push(
                new DialogField({
                    name: 'fieldsGroupAll',
                    placeholder: data.fieldsGroupAllPlaceholder,
                    fieldType: DialogFieldType.BOOLEAN,
                    value: true
                })
            );

            fieldsListLayout.push(100);
            fieldsList.push(
                new DialogField({
                    name: 'fieldsGroupList',
                    placeholder: data.fieldsGroupListPlaceholder,
                    inputOptions: data.fieldsGroupList,
                    inputOptionsRequiredMap: data.fieldsGroupListRequired,
                    inputOptionsMultiple: true,
                    required: true,
                    visible: (fieldsData): boolean => {
                        // if checkbox all is checked, clear the select
                        if (
                            fieldsData.fieldsGroupAll &&
                            fieldsData.fieldsGroupList
                        ) {
                            delete fieldsData.fieldsGroupList;
                        }

                        return !fieldsData.fieldsGroupAll;
                    }
                })
            );
        }

        // add field for use question variable
        if (data.displayUseDbColumns) {
            // use db columns
            fieldsListLayout.push(100);
            fieldsList.push(
                new DialogField({
                    name: 'useDbColumns',
                    placeholder: data.useDbColumnsPlaceholder,
                    fieldType: DialogFieldType.BOOLEAN,
                    description: data.useDbColumnsDescription
                })
            );

            // db columns values
            fieldsListLayout.push(100);
            fieldsList.push(
                new DialogField({
                    name: 'dontTranslateValues',
                    placeholder: data.useDbColumnsDontTranslateValuePlaceholder,
                    fieldType: DialogFieldType.BOOLEAN,
                    description: data.useDbColumnsDontTranslateValueDescription,
                    visible: (dialogFieldsValues: any): boolean => {
                        return !!dialogFieldsValues.useDbColumns;
                    }
                })
            );
        }

        // add field for use question variable
        if (data.displayUseQuestionVariable) {
            fieldsListLayout.push(100);
            fieldsList.push(
                new DialogField({
                    name: 'useQuestionVariable',
                    placeholder: data.useQuestionVariablePlaceholder,
                    fieldType: DialogFieldType.BOOLEAN,
                    description: data.useQuestionVariableDescription,
                    visible: (dialogFieldsValues: any): boolean => {
                        return !dialogFieldsValues.useDbColumns;
                    }
                })
            );
        }

        // add custom fields to dialog
        if (data.extraDialogFields) {
            // make sure we fill
            fieldsListLayout.push(100);
            fieldsList = [
                ...fieldsList,
                ...data.extraDialogFields
            ];
        }

        // construct query builder
        let qb: RequestQueryBuilder;
        if (
            data.queryBuilder &&
            !data.queryBuilder.isEmpty()
        ) {
            if (_.isEmpty(data.queryBuilderClearOthers)) {
                qb = _.cloneDeep(data.queryBuilder);
            } else {
                qb = new RequestQueryBuilder();
                _.each(data.queryBuilderClearOthers, (property: string) => {
                    qb[property] = _.cloneDeep(data.queryBuilder[property]);
                });
            }
        }

        // display dialog
        this.showInput(new DialogConfiguration({
            message: data.message,
            yesLabel: data.yesLabel,
            fieldsList: fieldsList,
            fieldsListLayout
        }))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // do not send the checkbox all value to api
                    if (!_.isUndefined(answer.inputValue.value.fieldsGroupAll)) {
                        delete answer.inputValue.value.fieldsGroupAll;
                    }

                    // call export start
                    if (data.exportStart) {
                        data.exportStart();
                    }

                    // export
                    (
                        data.isPOST ?
                            this.importExportDataService.exportPOSTData(
                                data.url,
                                _.merge(
                                    answer.inputValue.value,
                                    data.extraAPIData
                                ),
                                qb,
                                data.isAsyncExport ?
                                    'json' :
                                    'blob'
                            ) :
                            this.importExportDataService.exportData(
                                data.url,
                                _.merge(
                                    answer.inputValue.value,
                                    data.extraAPIData
                                ),
                                qb,
                                data.isAsyncExport ?
                                    'json' :
                                    'blob'
                            )
                    )
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showError('LNG_COMMON_LABEL_EXPORT_ERROR');

                                // call dialog closed
                                if (data.exportFinished) {
                                    data.exportFinished(answer);
                                }

                                return throwError(err);
                            })
                        )
                        .subscribe((blobOrJson) => {
                            // if not async then we should have file data, send it to browser download
                            if (!data.isAsyncExport) {
                                // save file
                                FileSaver.saveAs(
                                    blobOrJson as Blob,
                                    `${data.fileName}.${data.fileExtension ? data.fileExtension : answer.inputValue.value[data.allowedExportTypesKey]}`
                                );

                                // call dialog closed
                                if (data.exportFinished) {
                                    data.exportFinished(answer);
                                }
                            } else {
                                // handler to check status periodically
                                let startTime: Moment;
                                let processedErrorForCorrectTime: number = 0;
                                const checkStatusPeriodically = () => {
                                    this.exportLogDataService
                                        .getExportLog((blobOrJson as IAsyncExportResponse).exportLogId)
                                        .pipe(
                                            catchError((err) => {
                                                this.snackbarService.showError('LNG_COMMON_LABEL_EXPORT_ERROR');

                                                // call dialog closed
                                                if (data.exportFinished) {
                                                    data.exportFinished(answer);
                                                }

                                                return throwError(err);
                                            })
                                        )
                                        .subscribe((exportLogModel) => {
                                            // determine end estimated date
                                            let estimatedEndDate: Moment;
                                            if (exportLogModel.processedNo > 0) {
                                                // initialize start time if necessary
                                                if (!startTime) {
                                                    startTime = moment();
                                                    processedErrorForCorrectTime = exportLogModel.processedNo;
                                                }

                                                // determine estimated time
                                                const processed: number = exportLogModel.processedNo - processedErrorForCorrectTime;
                                                const total: number = exportLogModel.totalNo - processedErrorForCorrectTime;
                                                if (processed > 0) {
                                                    const processedSoFarTimeMs: number = moment().diff(startTime);
                                                    const requiredTimeForAllMs: number = processedSoFarTimeMs * total / processed;
                                                    const remainingTimeMs = requiredTimeForAllMs - processedSoFarTimeMs;
                                                    estimatedEndDate = moment().add(remainingTimeMs, 'ms');
                                                }
                                            }

                                            // update progress
                                            if (data.exportProgress) {
                                                data.exportProgress(
                                                    exportLogModel.statusStep,
                                                    exportLogModel.processedNo,
                                                    exportLogModel.totalNo,
                                                    estimatedEndDate
                                                );
                                            }

                                            // check if we still need to wait for data to be processed
                                            if (exportLogModel.status === Constants.SYSTEM_SYNC_LOG_STATUS.IN_PROGRESS.value) {
                                                // wait
                                                setTimeout(() => {
                                                    checkStatusPeriodically();
                                                }, 3000);

                                                // finished
                                                return;
                                            }


                                            // finished everything with success ?
                                            if (exportLogModel.status === Constants.SYSTEM_SYNC_LOG_STATUS.SUCCESS.value) {
                                                this.exportLogDataService
                                                    .download(exportLogModel.id)
                                                    .pipe(
                                                        catchError((err) => {
                                                            this.snackbarService.showError('LNG_COMMON_LABEL_EXPORT_ERROR');

                                                            // call dialog closed
                                                            if (data.exportFinished) {
                                                                data.exportFinished(answer);
                                                            }

                                                            return throwError(err);
                                                        })
                                                    )
                                                    .subscribe((dataBlob) => {
                                                        // update progress message
                                                        data.exportProgress(
                                                            exportLogModel.statusStep,
                                                            exportLogModel.processedNo,
                                                            exportLogModel.totalNo,
                                                            undefined
                                                        );

                                                        // save file
                                                        FileSaver.saveAs(
                                                            dataBlob,
                                                            `${data.fileName}.${data.fileExtension ? data.fileExtension : answer.inputValue.value[data.allowedExportTypesKey]}`
                                                        );

                                                        // call dialog closed
                                                        if (data.exportFinished) {
                                                            data.exportFinished(answer);
                                                        }
                                                    });
                                            }

                                            // process errors
                                            if (exportLogModel.status === Constants.SYSTEM_SYNC_LOG_STATUS.FAILED.value) {
                                                // error exporting data
                                                this.snackbarService.showError('LNG_COMMON_LABEL_EXPORT_ERROR');

                                                // call dialog closed
                                                if (data.exportFinished) {
                                                    data.exportFinished(answer);
                                                }

                                                // finished
                                                return;
                                            }

                                        });
                                };

                                // update status periodically
                                checkStatusPeriodically();
                            }
                        });
                } else {
                    // call dialog closed
                    if (data.exportFinished) {
                        data.exportFinished(answer);
                    }
                }
            });
    }

    /**
     * Display custom dialog
     * @param componentOrTemplateRef
     * @param config
     */
    showCustomDialog(
        componentOrTemplateRef: any,
        config: any
    ): Observable<any> {
        // open dialog
        return this.dialog.open(
            componentOrTemplateRef,
            config
        ).afterClosed();
    }

    /**
     * Display loading dialog
     */
    showLoadingDialog(conf?: {
        widthPx: number
    }): LoadingDialogModel {
        // display dialog
        const data: LoadingDialogDataModel = new LoadingDialogDataModel();
        const dialog: MatDialogRef<LoadingDialogComponent> = this.dialog.open(
            LoadingDialogComponent,
            Object.assign(
                {},
                LoadingDialogComponent.DEFAULT_CONFIG, {
                    data: data,
                    width: conf && conf.widthPx ? `${conf.widthPx}px` : undefined
                }
            )
        );

        // finished creating dialog
        return new LoadingDialogModel(
            Subscriber.create(() => {
                // close dialog
                dialog.close();
            }),
            data
        );
    }
}
