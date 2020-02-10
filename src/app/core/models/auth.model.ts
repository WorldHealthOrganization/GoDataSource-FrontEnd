import * as _ from 'lodash';
import { UserModel } from './user.model';

/**
 * Token information
 */
export interface ITokenInfo {
    ttl: number;
    isValid: boolean;
    approximatedExpireInSeconds: number;
    approximatedExpireInSecondsReal: number;
}

export class AuthModel {
    token: string;
    userId: string;
    user: UserModel;

    /**
     * Constructor
     */
    constructor(data) {
        this.token = _.get(data, 'id');
        this.userId = _.get(data, 'userId');
    }
}
