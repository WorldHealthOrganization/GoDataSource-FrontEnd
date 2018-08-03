import * as _ from 'lodash';
import { MetricChainsLengthModel } from './metric-chains-length.model';

export class MetricIndependentTransmissionChainsModel {
    length: number;
    activeChainsCount: number;
    isolatedNodesCount: number;
    chains: MetricChainsLengthModel[];

    constructor(data = null) {
        this.length = _.get(data, 'length', 0);
        this.activeChainsCount = _.get(data, 'activeChainsCount', 0);
        this.isolatedNodesCount = _.get(data, 'isolatedNodesCount', 0);
        this.chains = _.get(data, 'chains', []);
    }
}
