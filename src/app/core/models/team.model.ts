import * as _ from 'lodash';
import { UserModel } from './user.model';
import { LocationModel } from './location.model';

export class TeamModel {
    id: string;
    name: string;
    userIds: string[];
    members: UserModel[] = [];
    locationIds: string[];
    locations: LocationModel[] = [];

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.userIds = _.get(data, 'userIds', []);
        this.locationIds = _.get(data, 'locationIds', []);
    }
}

// classes created to prevent TS compiler error "Property 'x' does not exist on type 'never'"
export class MetricTeamFollowup {
    dates: [{}];
    id: string;
    successfulFollowupsCount: number;
    totalFollowupsCount: number;
}

export class TeamMapModel {
    dates: {};
    id: string;
    name: string;
}

