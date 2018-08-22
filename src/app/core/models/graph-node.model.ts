import * as _ from 'lodash';
import { EntityType } from './entity-type';

export class GraphNodeModel {
    id: string;
    name: string;
    type: EntityType;

    // default node color
    nodeColor: string;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.type = _.get(data, 'type', '');

        // default node color
        this.nodeColor = '#4DB0A0';
    }

}
