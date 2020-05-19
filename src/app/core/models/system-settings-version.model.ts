import * as _ from 'lodash';
import { CaptchaConfigModel } from './captcha-config.model';

export class SystemSettingsVersionModel {
    platform: string;
    version: string;
    build: string;
    arch: string;
    tokenTTL: number;
    skipOldPasswordForUserModify: boolean;
    captcha: CaptchaConfigModel;

    constructor(data = null) {
        this.platform = _.get(data, 'platform');
        this.version = _.get(data, 'version');
        this.build = _.get(data, 'build');
        this.arch = _.get(data, 'arch');
        this.tokenTTL = _.get(data, 'tokenTTL');
        this.skipOldPasswordForUserModify = _.get(data, 'skipOldPasswordForUserModify');
        this.captcha = new CaptchaConfigModel(_.get(data, 'captcha'));
    }
}
