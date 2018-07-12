import * as _ from 'lodash';

export class ReferenceDataCategoryModel {
    id: string;
    name: string;
    description: string;
    entries: ReferenceDataEntryModel[];

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.description = _.get(data, 'description');
        this.entries = _.get(data, 'entries', []);
    }
}

export class ReferenceDataEntryModel {
    id: string;
    categoryId: string;
    value: string;
    description: string;
    readonly: boolean;
    active: boolean;
    category: ReferenceDataCategoryModel;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.categoryId = _.get(data, 'categoryId');
        this.value = _.get(data, 'value');
        this.description = _.get(data, 'description');
        this.readonly = _.get(data, 'readOnly', false);
        this.active = _.get(data, 'active', true);

        // add category
        const categoryData = _.get(data, 'category');
        if (categoryData) {
            this.category = new ReferenceDataCategoryModel(categoryData);
        }
    }
}
