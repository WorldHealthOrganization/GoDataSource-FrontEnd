import * as _ from 'lodash';

export class PasswordChangeModel {
    oldPassword: string;
    newPassword: string;

    constructor(data = null) {
        this.oldPassword = _.get(data, 'oldPassword');
        this.newPassword = _.get(data, 'newPassword');
    }

}
