import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { LabelValuePair } from '../../../core/models/label-value-pair';
import { DialogService, ExportDataExtension } from '../../../core/services/helper/dialog.service';
import { RequestQueryBuilder } from '../../../core/helperClasses/request-query-builder';
import { DialogAnswer, DialogField } from '../dialog/dialog.component';

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
    @Input() message: string;
    @Input() extensionPlaceholder: string;
    @Input() encryptPlaceholder: string;
    @Input() anonymizePlaceholder: string;
    @Input() displayEncrypt: boolean;
    @Input() displayAnonymize: boolean;
    @Input() anonymizeFields: LabelValuePair[];
    @Input() url: string;
    @Input() yesLabel: string;
    @Input() fileName: string;
    @Input() queryBuilder: RequestQueryBuilder;
    @Input() queryBuilderClearOthers: string[];
    @Input() menuItem: boolean = false;
    @Input() isPOST: boolean = false;
    @Input() extraAPIData: {
        [key: string]: any
    };
    @Input() extraDialogFields: DialogField[];

    /**
     * If file type is provided, allowedExportTypes will be ignored
     */
    @Input() fileType: ExportDataExtension;
    @Input() allowedExportTypes: ExportDataExtension[];

    @Output() exportStart = new EventEmitter<void>();
    @Output() exportFinished = new EventEmitter<DialogAnswer>();

    constructor(
        private dialogService: DialogService = null
    ) {}

    triggerExport() {
        this.dialogService.showExportDialog({
            message: this.message,
            extensionPlaceholder: this.extensionPlaceholder,
            encryptPlaceholder: this.encryptPlaceholder,
            anonymizePlaceholder: this.anonymizePlaceholder,
            displayEncrypt: this.displayEncrypt,
            displayAnonymize: this.displayAnonymize,
            anonymizeFields: this.anonymizeFields,
            url: this.url,
            fileType: this.fileType,
            allowedExportTypes: this.allowedExportTypes,
            yesLabel: this.yesLabel,
            fileName: this.fileName,
            queryBuilder: this.queryBuilder,
            queryBuilderClearOthers: this.queryBuilderClearOthers,
            isPOST: this.isPOST,
            extraAPIData: this.extraAPIData,
            extraDialogFields: this.extraDialogFields,
            exportStart: () => { this.exportStartCallback(); },
            exportFinished: (answer) => { this.exportFinishedCallback(answer); }
        });
    }

    /**
     * Export finished handler
     * @param answer
     */
    exportFinishedCallback(answer: DialogAnswer) {
        this.exportFinished.emit(answer);
    }
    /**
     * Export start handler
     */
    exportStartCallback() {
        this.exportStart.emit();
    }
}
