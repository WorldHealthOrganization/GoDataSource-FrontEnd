import { ErrorModel } from './error.model';

export enum ExportSyncErrorModelCode {
  SYNC_NO_DATA_TO_EXPORT = 'SYNC_NO_DATA_TO_EXPORT'
}

/**
 * Constructor
 */
export class ExportSyncErrorModel extends ErrorModel {
  // data
  code: ExportSyncErrorModelCode;

  /**
   * Constructor
   */
  constructor(data = null) {
    // initialize common fields
    super(data);
  }
}
