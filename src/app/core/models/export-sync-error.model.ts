import { ErrorModel } from './error.model';

export enum ExportSyncErrorModelCode {
  SYNC_NO_DATA_TO_EXPORT = 'SYNC_NO_DATA_TO_EXPORT'
}

/**
 * Constructor
 */
export class ExportSyncErrorModel extends ErrorModel {
  code: ExportSyncErrorModelCode;

  constructor(data = null) {
    super(data);
  }
}
