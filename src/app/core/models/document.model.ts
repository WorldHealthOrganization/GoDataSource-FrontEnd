import * as _ from 'lodash';
import { I18nService } from '../services/helper/i18n.service';

export class DocumentModel {
  // data
  type: string;
  number: string;

  /**
   * Array to string
   */
  static arrayToString(
    i18nService: I18nService,
    documents: DocumentModel[]
  ): string {
    // nothing to do ?
    if (!documents?.length) {
      return '';
    }

    // create value
    let value: string = '';
    documents.forEach((doc) => {
      value += `${value.length < 1 ? '' : ', '}${doc.type?.length > 0 ? i18nService.instant(doc.type) : doc.type}: ${doc.number}`;
    });

    // finished
    return value;
  }

  /**
   * Constructor
   */
  constructor(data = null) {
    this.type = _.get(data, 'type');
    this.number = _.get(data, 'number');
  }
}
