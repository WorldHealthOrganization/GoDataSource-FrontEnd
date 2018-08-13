import * as _ from 'lodash';
import { GraphNodeModel } from './graph-node.model';
import { GraphEdgeModel } from './graph-edge.model';

export class GraphDataModel {
    nodes: any[];
    edges: any[];

    constructor(data = null) {
        this.nodes = _.get(data, 'source');
        this.target = _.get(data, 'target');

        // default node color
        this.edgeColor = '#4DB0A0';
    }

}
