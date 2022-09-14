import { ExportStatusStep } from '../../../models/constants';
import { Moment } from 'moment';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { RequestQueryBuilder } from '../../../helperClasses/request-query-builder';
import { IV2SideDialogHandler, V2SideDialogConfigInput } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';

/**
 * Export data config progress answer
 */
export interface IV2ExportDataConfigProgressAnswer {
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
 * Export button keys
 */
export enum ExportButtonKey {
  EXPORT = 'export'
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
 * Export method
 */
export enum ExportDataMethod {
  POST,
  GET
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
  title: {
    // required
    get: () => string,

    // optional
    data?: () => {
      [key: string]: string
    }
  };
  export: {
    // required
    url: string,
    async: boolean,
    method: ExportDataMethod,
    fileName: string,
    allow: {
      // required
      types: ExportDataExtension[],

      // optional
      encrypt?: boolean,
      anonymize?: false | {
        // required
        fields: ILabelValuePairModel[],

        // optional
        key?: string
      },
      groups?: false | {
        // required
        fields: ILabelValuePairModel[],

        // optional
        required?: IV2ExportDataConfigGroupsRequired
      },
      fields?: ILabelValuePairModel[],
      dbColumns?: boolean,
      dbValues?: boolean,
      jsonReplaceUndefinedWithNull?: boolean,
      questionnaireVariables?: boolean
    },

    // optional
    queryBuilder?: RequestQueryBuilder,
    inputs?: {
      prepend?: V2SideDialogConfigInput[],
      append?: V2SideDialogConfigInput[]
    },
    extraFormData?: {
      append: {
        [key: string]: any
      }
    }
  };

  // optional
  initialized?: (handler: IV2SideDialogHandler) => void;
}

/**
 * Load config and Export data
 */
export interface IV2ExportDataConfigLoaderConfig {
  // required
  title: {
    // required
    get: () => string,

    // optional
    data?: () => {
      [key: string]: string
    }
  };
  load: (finished: (config: IV2ExportDataConfig) => void) => void;
}
