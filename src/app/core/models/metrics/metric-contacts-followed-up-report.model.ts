import * as _ from 'lodash';

export class MetricContactsFollowedUpReportModel {
    day: string;
    followedUp: number;
    notFollowedUp: number;
    percentage: number;

    constructor(data = null) {
        this.day = _.get(data, 'day', '');
        this.followedUp = _.get(data, 'followedUp', 0);
        this.notFollowedUp = _.get(data, 'notFollowedUp', 0);
        this.percentage = _.get(data, 'percentage', 0);
    }
}
