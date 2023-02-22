import * as _ from 'lodash';

export abstract class ErrorModel {
  protected statusCode: number;
  protected name: string;
  protected message: string;
  protected code: string;

  /**
   * Constructor
   */
  protected constructor(data = null) {
    this.statusCode = _.get(data, 'statusCode');
    this.name = _.get(data, 'name');
    this.message = _.get(data, 'message');
    this.code = _.get(data, 'code');
  }
}
