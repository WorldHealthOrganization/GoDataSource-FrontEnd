import * as _ from 'lodash';

export abstract class ErrorModel {
  // data
  readonly statusCode: number;
  readonly name: string;
  readonly message: string;
  readonly code: string;

  /**
   * Constructor
   */
  protected constructor(data = null) {
    // data
    this.statusCode = _.get(data, 'statusCode');
    this.name = _.get(data, 'name');
    this.message = _.get(data, 'message');
    this.code = _.get(data, 'code');
  }
}
