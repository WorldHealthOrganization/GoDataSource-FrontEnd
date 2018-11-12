import * as _ from 'lodash';

export class HelpCategoryModel {
    id: string;
    name: string;
    description: string;
    order: number;
    deleted: boolean

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.description = _.get(data, 'description');
        this.deleted = _.get(data, 'deleted', false);
        this.order = _.get(data, 'order', 1);
    }

}
