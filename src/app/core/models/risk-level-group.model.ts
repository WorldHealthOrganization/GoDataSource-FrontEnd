import * as _ from 'lodash';
import { RiskLevelModel } from './risk-level.model';

export class RiskLevelGroupModel {
    count: number;
    riskLevels: RiskLevelModel[];

    constructor(data = null) {
        this.count = _.get(data, 'count');
        this.riskLevels = _.get(data, 'riskLevel', []);
    }
}
