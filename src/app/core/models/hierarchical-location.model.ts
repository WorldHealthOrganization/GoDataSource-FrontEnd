import * as _ from 'lodash';
import { LocationModel } from './location.model';

export class HierarchicalLocationModel {
    location: LocationModel;
    children: HierarchicalLocationModel[];

    constructor(data = null) {
        this.location = _.get(data, 'location');
        this.location = new LocationModel(this.location);

        this.children = _.get(data, 'children', []);
        this.children = _.map(this.children, (loc) => new HierarchicalLocationModel(loc));
    }
}
