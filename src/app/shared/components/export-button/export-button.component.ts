import { Component, ElementRef, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { LabelValuePair } from '../../../core/models/label-value-pair';
import { DialogService, ExportDataExtension } from '../../../core/services/helper/dialog.service';

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
    @Input() allowedExportTypes: ExportDataExtension[];
    @Input() yesLabel: string;
    @Input() fileName: string;

    @ViewChild('buttonDownloadFile') private buttonDownloadFile: ElementRef;

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
            allowedExportTypes: this.allowedExportTypes,
            yesLabel: this.yesLabel,
            fileName: this.fileName,
            buttonDownloadFile: this.buttonDownloadFile
        });
    }
}
