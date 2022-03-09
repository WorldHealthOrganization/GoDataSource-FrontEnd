import { Injectable } from '@angular/core';
import { Observable, Subject, Subscriber } from 'rxjs';
import {
  IV2SideDialog,
  IV2SideDialogConfig,
  IV2SideDialogConfigButtonType,
  IV2SideDialogConfigInputCheckbox,
  IV2SideDialogConfigInputSingleDropdown,
  IV2SideDialogResponse,
  V2SideDialogConfigAction,
  V2SideDialogConfigInput,
  V2SideDialogConfigInputType
} from '../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { ExportStatusStep } from '../../models/constants';
import { Moment } from 'moment';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { ILabelValuePairModel } from '../../../shared/forms-v2/core/label-value-pair.model';

/**
 * Export data config progress answer
 */
interface IV2ExportDataConfigProgressAnswer {
  // required
  readonly step: ExportStatusStep;
  readonly processed: number;
  readonly total: number;

  // optional
  readonly estimatedEndDate?: Moment;
  readonly downloadedBytes?: string;
  readonly totalBytes?: string
}

/**
 * Export accepted extensions
 */
export enum ExportDataExtension {
  CSV = 'csv',
  XLS = 'xls',
  XLSX = 'xlsx',
  ODS = 'ods',
  JSON = 'json',
  PDF = 'pdf',
  ZIP = 'zip',
  QR = 'qr'
}

/**
 * Export data config
 */
export interface IV2ExportDataConfig {
  // required
  title: string;
  export: {
    // required
    url: string,
    async: boolean,
    fileName: string,
    allow: {
      // required
      types: ExportDataExtension[],

      // optional
      encrypt?: boolean,
      anonymize?: false | {
        fields: ILabelValuePairModel[]
      },
      groups?: false | {
        // required
        fields: ILabelValuePairModel[],

        // optional
        required?: {
          [groupValue: string]: string[]
        }
      },
      dbColumns?: boolean,
      dbValues?: boolean,
      jsonReplaceUndefinedWithNull?: boolean,
      questionnaireVariables?: boolean
    },

    // optional
    progress?: (data: IV2ExportDataConfigProgressAnswer) => void,
    start?: () => void,
    end?: () => void,
    queryBuilder?: RequestQueryBuilder,
    inputs?: {
      prepend?: V2SideDialogConfigInput[],
      append?: V2SideDialogConfigInput[]
    }
  }
}

@Injectable()
export class DialogV2Service {
  // used to show and update side dialog
  private _sideDialogSubject$: Subject<IV2SideDialog> = new Subject<IV2SideDialog>();

  /**
   * Side dialog subject handler
   */
  get sideDialogSubject$(): Subject<IV2SideDialog> {
    return this._sideDialogSubject$;
  }

  /**
   * Show side dialog
   */
  showSideDialog(config: IV2SideDialogConfig): Observable<IV2SideDialogResponse> {
    return new Observable<IV2SideDialogResponse>((observer) => {
      this._sideDialogSubject$.next({
        action: V2SideDialogConfigAction.OPEN,
        config,
        responseSubscriber: observer
      });
    });
  }

  /**
   * Show export data
   */
  showExportData(config: IV2ExportDataConfig): void {
    // construct list of inputs specific to export dialog
    const inputs: V2SideDialogConfigInput[] = [];

    // extra fields - prepend ?
    if (config.export.inputs?.prepend) {
      inputs.push(...config.export.inputs.prepend);
    }

    // attach export allowed file types
    inputs.push({
      type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
      placeholder: 'LNG_COMMON_LABEL_EXPORT_TYPE',
      name: 'fileType',
      value: undefined,
      options: config.export.allow.types.map((type) => ({
        label: type,
        value: type
      }))
    });

    // attach encrypt
    if (config.export.allow.encrypt) {
      inputs.push({
        type: V2SideDialogConfigInputType.TEXT,
        placeholder: 'LNG_COMMON_LABEL_EXPORT_ENCRYPT_PASSWORD',
        name: 'encryptPassword',
        value: undefined
      });
    }

    // attach anonymize
    if (
      config.export.allow.anonymize &&
      config.export.allow.anonymize.fields
    ) {
      inputs.push({
        type: V2SideDialogConfigInputType.DROPDOWN_MULTI,
        placeholder: 'LNG_COMMON_LABEL_EXPORT_ANONYMIZE_FIELDS',
        name: 'anonymizeFields',
        values: [],
        options: config.export.allow.anonymize.fields
      });
    }

    // groups
    if (config.export.allow.groups) {
      // all
      inputs.push(
        {
          type: V2SideDialogConfigInputType.DIVIDER
        }, {
          type: V2SideDialogConfigInputType.CHECKBOX,
          placeholder: 'LNG_COMMON_LABEL_EXPORT_FIELDS_GROUPS_ALL',
          name: 'fieldsGroupAll',
          checked: true
        }
      );

      // specific groups
      inputs.push(
        {
          type: V2SideDialogConfigInputType.DROPDOWN_MULTI,
          placeholder: 'LNG_COMMON_LABEL_EXPORT_FIELDS_GROUPS',
          name: 'fieldsGroupList',
          values: [],
          options: config.export.allow.groups.fields,
          disabled: (data): boolean => {
            return (data.map.fieldsGroupAll as IV2SideDialogConfigInputCheckbox).checked;
          },
          // ..required map - #TODO - config.export.allow.groups.required
        }, {
          type: V2SideDialogConfigInputType.DIVIDER
        }
      );
    }

    // add options title
    if (
      config.export.allow.dbColumns ||
      config.export.allow.dbValues ||
      config.export.allow.jsonReplaceUndefinedWithNull ||
      config.export.allow.questionnaireVariables
    ) {
      inputs.push(
        {
          type: V2SideDialogConfigInputType.DIVIDER,
          placeholder: 'LNG_COMMON_LABEL_EXPORT_OPTIONS'
        }
      );
    }

    // use db field names as column headers
    if (config.export.allow.dbColumns) {
      inputs.push({
        type: V2SideDialogConfigInputType.CHECKBOX,
        placeholder: 'LNG_COMMON_LABEL_EXPORT_USE_DB_COLUMNS',
        name: 'useDbColumns',
        checked: false
      });

      // use db values instead of formatting them like translating tokens etc...
      if (config.export.allow.dbValues) {
        inputs.push({
          type: V2SideDialogConfigInputType.CHECKBOX,
          placeholder: 'LNG_COMMON_LABEL_EXPORT_USE_DB_COLUMNS_NO_TRANSLATED_VALUES',
          name: 'dontTranslateValues',
          checked: false,
          disabled: (data): boolean => {
            return !(data.map.useDbColumns as IV2SideDialogConfigInputCheckbox).checked;
          }
        });
      }
    }

    // when json type is selected allow user to replace undefined values with null, so he gets all data
    if (config.export.allow.jsonReplaceUndefinedWithNull) {
      inputs.push({
        type: V2SideDialogConfigInputType.CHECKBOX,
        placeholder: 'LNG_COMMON_LABEL_EXPORT_JSON_REPLACE_UNDEFINED_WITH_NULL',
        name: 'jsonReplaceUndefinedWithNull',
        checked: false,
        disabled: (data): boolean => {
          return (data.map.fileType as IV2SideDialogConfigInputSingleDropdown).value !== ExportDataExtension.JSON;
        }
      });
    }

    // use question variables instead of translating them
    if (config.export.allow.questionnaireVariables) {
      inputs.push({
        type: V2SideDialogConfigInputType.CHECKBOX,
        placeholder: 'LNG_COMMON_LABEL_EXPORT_USE_QUESTION_VARIABLE',
        name: 'useQuestionVariable',
        checked: false,
        disabled: (data): boolean => {
          return (data.map.useDbColumns as IV2SideDialogConfigInputCheckbox).checked;
        }
      });
    }

    // extra fields - append ?
    if (config.export.inputs?.append) {
      inputs.push(...config.export.inputs.append);
    }

    // display dialog
    this._sideDialogSubject$
      .next({
        action: V2SideDialogConfigAction.OPEN,
        config: {
          title: config.title,
          inputs: inputs,
          bottomButtons: [{
            type: IV2SideDialogConfigButtonType.OTHER,
            label: 'LNG_COMMON_LABEL_EXPORT',
            color: 'primary',
            key: 'export'
          }, {
            type: IV2SideDialogConfigButtonType.CANCEL,
            label: 'cancel',
            color: 'text'
          }]
        },
        responseSubscriber: new Subscriber<IV2SideDialogResponse>((response) => {
          console.log(response);
        })
      });
  }
}
