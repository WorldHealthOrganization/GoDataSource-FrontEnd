import * as _ from 'lodash';
import { EntityType } from './entity-type';

export class RelationshipPersonModel {
    id: string;
    type: EntityType;
    source: boolean;
    target: boolean;

    constructor(data) {
        this.id = _.get(data, 'id');
        this.type = _.get(data, 'type');
        this.source = _.get(data, 'source', false);
        this.target = _.get(data, 'target', false);
    }
}
