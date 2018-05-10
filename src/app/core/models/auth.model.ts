import * as _ from 'lodash';

import { UserModel } from './user.model';

export class AuthModel {
    token: string;
    userId: string;
    user: UserModel;

    constructor(data) {
        this.token = _.get(data, 'id');
        this.userId = _.get(data, 'userId');
    }

}
