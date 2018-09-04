import { Component, ElementRef, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { DialogAnswer, DialogAnswerButton, DialogConfiguration } from '../dialog/dialog.component';
import { LabelValuePair } from '../../../core/models/label-value-pair';
import { DialogService } from '../../../core/services/helper/dialog.service';
import { ImportExportDataService } from '../../../core/services/data/import-export.data.service';
import * as _ from 'lodash';

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
    @Input() placeholder: string = '';
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
        private importExportDataService: ImportExportDataService = null
    ) {}

    triggerExport() {
        this.dialogService.showInput(new DialogConfiguration({
            message: this.message,
            yesLabel: this.yesLabel,
            placeholder: this.placeholder,
            customInputOptions: _.map(this.allowedExportTypes, (item: ExportDataExtension) => {
                return new LabelValuePair(
                    item as string,
                    item as string
                );
            }),
            customInputOptionsMultiple: false
        })).subscribe((answer: DialogAnswer) => {
            if (answer.button === DialogAnswerButton.Yes) {
                this.importExportDataService.exportData(
                    this.url,
                    answer.inputValue.value
                ).subscribe((blob) => {
                    const url = window.URL.createObjectURL(blob);

                    const link = this.buttonDownloadFile.nativeElement;
                    link.href = url;
                    link.download = `${this.fileName}.${answer.inputValue.value}`;
                    link.click();

                    window.URL.revokeObjectURL(url);
                });
            }
        });
    }
}
