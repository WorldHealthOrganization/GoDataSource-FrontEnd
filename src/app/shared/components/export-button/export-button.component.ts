import { Component, ElementRef, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { DialogAnswer, DialogAnswerButton, DialogConfiguration, DialogField } from '../dialog/dialog.component';
import { LabelValuePair } from '../../../core/models/label-value-pair';
import { DialogService } from '../../../core/services/helper/dialog.service';
import { ImportExportDataService } from '../../../core/services/data/import-export.data.service';
import * as _ from 'lodash';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../core/services/helper/snackbar.service';

export enum ExportDataExtension {
    CSV = 'csv',
    XLS = 'xls',
    XLSX = 'xlsx',
    XML = 'xml',
    ODS = 'ods',
    JSON = 'json'
}

@Component({
    selector: 'app-export-button',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './export-button.component.html',
    styleUrls: ['./export-button.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: ExportButtonComponent,
        multi: true
    }]
})
export class ExportButtonComponent {
    @Input() label: string = 'LNG_COMMON_BUTTON_EXPORT';
    @Input() message: string = '';
    @Input() extensionPlaceholder: string = 'LNG_COMMON_LABEL_EXPORT_TYPE';
    @Input() encryptPlaceholder: string = 'LNG_COMMON_LABEL_EXPORT_ENCRYPT_PASSWORD';
    @Input() anonymizePlaceholder: string = 'LNG_COMMON_LABEL_EXPORT_ANONYMIZE_FIELDS';
    @Input() displayEncrypt: boolean = false;
    @Input() displayAnonymize: boolean = false;
    @Input() anonymizeFields: LabelValuePair[];
    @Input() url: string = '';
    @Input() allowedExportTypes: ExportDataExtension[] = [
        ExportDataExtension.CSV,
        ExportDataExtension.XLS,
        ExportDataExtension.XLSX,
        ExportDataExtension.XML,
        ExportDataExtension.ODS,
        ExportDataExtension.JSON
    ];
    @Input() yesLabel: string = 'LNG_COMMON_LABEL_EXPORT';
    @Input() fileName: string = 'file';

    @ViewChild('buttonDownloadFile') private buttonDownloadFile: ElementRef;

    constructor(
        private dialogService: DialogService = null,
        private importExportDataService: ImportExportDataService = null,
        private snackbarService: SnackbarService
    ) {}

    triggerExport() {
        // construct list of inputs that we need in the dialog
        const fieldsList: DialogField[] = [
            new DialogField({
                name: 'fileType',
                placeholder: this.extensionPlaceholder,
                inputOptions: _.map(this.allowedExportTypes, (item: ExportDataExtension) => {
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
        if (this.displayEncrypt) {
            fieldsList.push(
                new DialogField({
                    name: 'encryptPassword',
                    placeholder: this.encryptPlaceholder,
                    requiredOneOfTwo: 'anonymizeFields'
                })
            );
        }

        // add encrypt anonymize fields
        if (this.displayAnonymize) {
            fieldsList.push(
                new DialogField({
                    name: 'anonymizeFields',
                    placeholder: this.anonymizePlaceholder,
                    inputOptions: this.anonymizeFields,
                    inputOptionsMultiple: true,
                    requiredOneOfTwo: 'encryptPassword'
                })
            );
        }

        // display dialog
        this.dialogService
            .showInput(new DialogConfiguration({
                message: this.message,
                yesLabel: this.yesLabel,
                fieldsList: fieldsList
            }))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.importExportDataService
                        .exportData(
                            this.url,
                            answer.inputValue.value
                        ).catch((err) => {
                            this.snackbarService.showError('LNG_COMMON_LABEL_EXPORT_ERROR');
                            return ErrorObservable.create(err);
                        }).subscribe((blob) => {
                            const url = window.URL.createObjectURL(blob);

                            const link = this.buttonDownloadFile.nativeElement;
                            link.href = url;
                            link.download = `${this.fileName}.${answer.inputValue.value.fileType}`;
                            link.click();

                            window.URL.revokeObjectURL(url);
                        });
                }
            });
    }
}
