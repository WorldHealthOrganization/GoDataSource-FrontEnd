import * as _ from 'lodash';
import { ErrorModel } from './error.model';

export enum VisualIdErrorModelCode {
  INVALID_VISUAL_ID_MASK = 'INVALID_VISUAL_ID_MASK',
  DUPLICATE_VISUAL_ID = 'DUPLICATE_VISUAL_ID'
}

export class VisualIdErrorModel extends ErrorModel {
  code: VisualIdErrorModelCode;
  details: {
    visualIdTemplate: string,
    outbreakVisualIdMask: string
  };

  /**
   * Constructor
   */
  constructor(data = null) {
    super(data);

    // import specific data
    this.details = _.get(data, 'details');
  }
}
