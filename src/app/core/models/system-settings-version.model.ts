import * as _ from 'lodash';

export class SystemSettingsVersionModel {
    platform: string;
    version: string;
    build: string;
    arch: string;
    tokenTTL: number;

    constructor(data = null) {
        this.platform = _.get(data, 'platform');
        this.version = _.get(data, 'version');
        this.build = _.get(data, 'build');
        this.arch = _.get(data, 'arch');
        this.tokenTTL = _.get(data, 'tokenTTL');
    }
}
