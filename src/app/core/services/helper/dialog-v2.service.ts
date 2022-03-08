import { Injectable } from '@angular/core';
import { Observable, Subject, Subscriber } from 'rxjs';
import { IV2SideDialog, IV2SideDialogConfig, IV2SideDialogResponse, V2SideDialogConfigAction, V2SideDialogConfigInput, V2SideDialogConfigInputType } from '../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
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
      questionnaire?: boolean,
      dbFields?: boolean,
      jsonReplaceUndefinedWithNull?: boolean
    },

    // optional
    progress?: (data: IV2ExportDataConfigProgressAnswer) => void,
    start?: () => void,
    end?: () => void,
    queryBuilder?: RequestQueryBuilder
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

    // groups
    if (config.export.allow.groups) {
      // all
      inputs.push({
        type: V2SideDialogConfigInputType.CHECKBOX,
        placeholder: 'LNG_COMMON_LABEL_EXPORT_FIELDS_GROUPS_ALL',
        name: 'fieldsGroupAll',
        checked: true
      });

      // specific
      // #TODO
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

    // display dialog
    this._sideDialogSubject$
      .next({
        action: V2SideDialogConfigAction.OPEN,
        config: {
          title: config.title,
          inputs: inputs,
          bottomButtons: []
        },
        responseSubscriber: new Subscriber<IV2SideDialogResponse>((response) => {
          console.log(response);
        })
      });
  }
}
