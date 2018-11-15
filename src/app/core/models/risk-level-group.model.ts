import * as _ from 'lodash';
import { RiskLevelModel } from './risk-level.model';

export class RiskLevelGroupModel {
    count: number;
    riskLevel: RiskLevelModel[];

    constructor(data = null) {
        this.count = _.get(data, 'count');
        this.riskLevel = _.get(data, 'riskLevel', []);
    }
}
