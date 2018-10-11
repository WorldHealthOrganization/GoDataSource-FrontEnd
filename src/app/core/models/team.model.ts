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
