import * as _ from 'lodash';

export class CaptchaConfigModel {
    login: boolean;
    forgotPassword: boolean;
    resetPasswordQuestions: boolean;

    constructor(data = null) {
        this.login = _.get(data, 'login');
        this.forgotPassword = _.get(data, 'forgotPassword');
        this.resetPasswordQuestions = _.get(data, 'resetPasswordQuestions');
    }
}
