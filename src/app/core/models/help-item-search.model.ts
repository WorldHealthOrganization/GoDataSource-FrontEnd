import * as _ from 'lodash';
import { HelpItemModel } from './help-item.model';

export class HelpItemSearchModel {
    items: HelpItemModel[];

    constructor(data = null) {
        this.items = _.get(data, 'items');
    }

}
