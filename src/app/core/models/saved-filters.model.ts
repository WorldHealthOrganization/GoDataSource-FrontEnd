import * as _ from 'lodash';
import { FilterModel } from '../../shared/components/side-filters/model';

export class SavedFilterModel{
    id: string;
    name: string;
    userId: string;
    isPublic: boolean;
    filterKey: string;
    filterData: FilterModel[];

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.userId = _.get(data, 'userId');
        this.isPublic = _.get(data, 'isPublic', false);
        this.filterKey = _.get(data, 'filterKey');
        this.filterData = _.get(data, 'filterData', []);
    }
}
