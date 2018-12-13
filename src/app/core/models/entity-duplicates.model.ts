import * as _ from 'lodash';
import { EntityModel } from './entity.model';

export class EntityDuplicatesModel {
    duplicates: EntityModel[];

    constructor(data = null) {
        this.duplicates = _.map(
            _.get(data, 'duplicates'),
            (childData) => {
                return new EntityModel(childData);
            },
            []
        );
    }
}
