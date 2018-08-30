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

        // set color based on type
        switch (this.type) {
            case EntityType.CASE: {
                this.nodeColor = '#4DB0A0';
                break;
            }
            case EntityType.CONTACT: {
                this.nodeColor = '#008DC9';
                break;
            }
            case EntityType.EVENT: {
                this.nodeColor = '#F44708';
                break;
            }
            default: {
                this.nodeColor = '#4DB0A0';
                break;
            }
        }
    }

}
