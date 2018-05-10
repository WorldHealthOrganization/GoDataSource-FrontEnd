import * as _ from 'lodash';

export class UserModel {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;

    constructor(data) {
        this.id = _.get(data, 'id');
        this.firstName = _.get(data, 'firstName');
        this.lastName = _.get(data, 'lastName');
        this.username = _.get(data, 'username');
        this.email = _.get(data, 'email');
    }
}
