import * as _ from 'lodash';
export class SavedImportMappingModel {

    id: string;
    name: string;
    isPublic: boolean;
    readonly: boolean;
    mappings;

    constructor(data: {
        id?: string,
        name?: string,
        isPublic?: boolean,
        readonly?: boolean,
        // mappings?: []
    }) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.isPublic = _.get(data, 'isPublic', false);
        this.readonly = _.get(data, 'readonly', false);
        // this.mappings = _.get(data, 'mappings', []);
    }
}
