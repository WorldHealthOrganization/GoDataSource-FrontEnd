import * as _ from 'lodash';

export class GraphNodeDataModel {
    id: string;
    name: string;

    // default node color
    nodeColor: string;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');

        // default node color
        this.nodeColor = '#4DB0A0';
    }

}
