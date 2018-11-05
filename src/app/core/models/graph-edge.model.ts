import * as _ from 'lodash';
import { EntityType } from './entity-type';
import { Constants } from './constants';

export class GraphEdgeModel {
    id: string;
    source: string;
    target: string;
    sourceType: EntityType;
    targetType: EntityType;
    edgeColor: string;
    edgeStyle: string;
    label: string;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.source = _.get(data, 'source');
        this.target = _.get(data, 'target');
        this.sourceType = _.get(data, 'sourceType');
        this.targetType = _.get(data, 'targetType');
        this.edgeColor = _.get(data, 'edgeColor', Constants.DEFAULT_COLOR_CHAINS);
        this.edgeStyle = _.get(data, 'edgeStyle', 'solid');
        this.label = _.get(data, 'label', 'aaaa');
    }

}
