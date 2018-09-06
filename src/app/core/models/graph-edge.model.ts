import * as _ from 'lodash';
import { EntityType } from './entity-type';

export class GraphEdgeModel {
    source: string;
    target: string;
    sourceType: string;
    targetType: string;
    edgeColor: string;

    constructor(data = null) {
        this.source = _.get(data, 'source');
        this.target = _.get(data, 'target');
        this.sourceType = _.get(data, 'sourceType');
        this.targetType = _.get(data, 'targetType');

        this.edgeColor = '#4DB0A0';
    }

    setEdgeColor() {
        // set the colors based on nodes type
        switch (this.targetType) {
            case EntityType.CASE: {
                this.edgeColor = '#4DB0A0';
                break;
            }
            case EntityType.CONTACT: {
                this.edgeColor = '#008DC9';
                break;
            }
            case EntityType.EVENT: {
                this.edgeColor = '#F44708';
                break;
            }
            default: {
                this.edgeColor = '#4DB0A0';
                break;
            }
        }
    }

}
