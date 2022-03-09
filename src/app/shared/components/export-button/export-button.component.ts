import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { LabelValuePair } from '../../../core/models/label-value-pair';
import { DialogExportProgressAnswer, DialogService, ExportDataExtension } from '../../../core/services/helper/dialog.service';
import { RequestQueryBuilder } from '../../../core/helperClasses/request-query-builder';
import { DialogAnswer, DialogField } from '../dialog/dialog.component';
import { IExportFieldsGroupRequired } from '../../../core/models/export-fields-group.model';

@Component({
  selector: 'app-export-button',
  templateUrl: './export-button.component.html',
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
  @Input() fieldsGroupAllPlaceholder: string;
  @Input() fieldsGroupListPlaceholder: string;
  @Input() displayEncrypt: boolean;
  @Input() displayAnonymize: boolean;
  @Input() displayFieldsGroupList: boolean;
  @Input() anonymizeFields: LabelValuePair[];
  @Input() fieldsGroupList: LabelValuePair[];
  @Input() fieldsGroupListRequired: IExportFieldsGroupRequired;
  @Input() url: string;
  @Input() yesLabel: string;
  @Input() fileName: string;
  @Input() queryBuilder: RequestQueryBuilder;
  @Input() menuItem: boolean = false;
  @Input() isPOST: boolean = false;
  @Input() displayUseQuestionVariable: boolean = false;
  @Input() useQuestionVariableDescription: string;
  @Input() useQuestionVariablePlaceholder: string;
  @Input() displayUseDbColumns: boolean = false;
  @Input() displayJsonReplaceUndefinedWithNull: boolean = false;
  @Input() useDbColumnsPlaceholder: string;
  @Input() useDbColumnsDescription: string;
  @Input() useDbColumnsDontTranslateValuePlaceholder: string;
  @Input() useDbColumnsDontTranslateValueDescription: string;
  @Input() extraAPIData: {
    [key: string]: any
  };
  @Input() extraDialogFields: DialogField[];

  // async export ?
  @Input() isAsyncExport: boolean;

  /**
     * If file type is provided, allowedExportTypes will be ignored
     */
  @Input() fileType: ExportDataExtension;
  @Input() allowedExportTypes: ExportDataExtension[];

  @Output() exportStart = new EventEmitter<void>();
  @Output() exportFinished = new EventEmitter<DialogAnswer>();
  @Output() exportProgress = new EventEmitter<DialogExportProgressAnswer>();

  /**
     * Constructor
     */
  constructor(
    private dialogService: DialogService = null
  ) {}

  /**
     * Trigger export
     */
  triggerExport() {
    this.dialogService.showExportDialog({
      message: this.message,
      extensionPlaceholder: this.extensionPlaceholder,
      encryptPlaceholder: this.encryptPlaceholder,
      anonymizePlaceholder: this.anonymizePlaceholder,
      fieldsGroupAllPlaceholder: this.fieldsGroupAllPlaceholder,
      fieldsGroupListPlaceholder: this.fieldsGroupListPlaceholder,
      displayEncrypt: this.displayEncrypt,
      displayAnonymize: this.displayAnonymize,
      displayFieldsGroupList: this.displayFieldsGroupList,
      displayUseQuestionVariable: this.displayUseQuestionVariable,
      useQuestionVariablePlaceholder: this.useQuestionVariablePlaceholder,
      useQuestionVariableDescription: this.useQuestionVariableDescription,
      useDbColumnsDontTranslateValuePlaceholder: this.useDbColumnsDontTranslateValuePlaceholder,
      useDbColumnsDontTranslateValueDescription: this.useDbColumnsDontTranslateValueDescription,
      displayUseDbColumns: this.displayUseDbColumns,
      displayJsonReplaceUndefinedWithNull: this.displayJsonReplaceUndefinedWithNull,
      useDbColumnsPlaceholder: this.useDbColumnsPlaceholder,
      useDbColumnsDescription: this.useDbColumnsDescription,
      anonymizeFields: this.anonymizeFields,
      fieldsGroupList: this.fieldsGroupList,
      fieldsGroupListRequired: this.fieldsGroupListRequired,
      url: this.url,
      fileType: this.fileType,
      allowedExportTypes: this.allowedExportTypes,
      yesLabel: this.yesLabel,
      fileName: this.fileName,
      queryBuilder: this.queryBuilder,
      isPOST: this.isPOST,
      extraAPIData: this.extraAPIData,
      extraDialogFields: this.extraDialogFields,
      isAsyncExport: this.isAsyncExport,
      exportStart: () => { this.exportStartCallback(); },
      exportFinished: (answer) => { this.exportFinishedCallback(answer); },
      exportProgress: (data) => {
        this.exportProgress.emit(data);
      }
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
