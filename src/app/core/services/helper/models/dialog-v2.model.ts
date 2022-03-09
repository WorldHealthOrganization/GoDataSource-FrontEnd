import { ExportStatusStep } from '../../../models/constants';
import { Moment } from 'moment';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { RequestQueryBuilder } from '../../../helperClasses/request-query-builder';
import { V2SideDialogConfigInput } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';

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
 * Group required options
 */
export interface IV2ExportDataConfigGroupsRequired {
  [groupValue: string]: string[]
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
        required?: IV2ExportDataConfigGroupsRequired
      },
      dbColumns?: boolean,
      dbValues?: boolean,
      jsonReplaceUndefinedWithNull?: boolean,
      questionnaireVariables?: boolean
    },

    // optional
    progress?: (data: IV2ExportDataConfigProgressAnswer) => void,
    queryBuilder?: RequestQueryBuilder,
    inputs?: {
      prepend?: V2SideDialogConfigInput[],
      append?: V2SideDialogConfigInput[]
    }
  }
}
