import * as _ from 'lodash';

export class GraphEdgeModel {
    source: string;
    target: string;
    edgeColor: string;

    constructor(data = null) {
        this.source = _.get(data, 'source');
        this.target = _.get(data, 'target');

        // default node color
        this.edgeColor = '#4DB0A0';
    }

}
