import * as _ from 'lodash';

export class SystemSettingsVersionModel {
    platform: string;
    type: string;
    version: string;
    build: string;
    arch: string;

    constructor(data = null) {
        this.platform = _.get(data, 'platform');
        this.type = _.get(data, 'type');
        this.version = _.get(data, 'version');
        this.build = _.get(data, 'build');
        this.arch = _.get(data, 'arch');
    }
}
