import * as _ from 'lodash';

export class SystemUpstreamServerCredentialsModel {
    id: string;
    clientId: string;
    clientSecret: string;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.clientId = _.get(data, 'clientId');
        this.clientSecret = _.get(data, 'clientSecret');
    }
}
