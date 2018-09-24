import * as _ from 'lodash';
import { environment } from '../../../environments/environment';

export class IconModel {
    id: string;
    name: string;

    url: string;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');

        if (this.id) {
            this.url = `${environment.apiUrl}/icons/${this.id}/download`;
        }
    }
}
