import * as _ from 'lodash';

export class FillLocationModel {
    geoLocation: {
        lat: number,
        lng: number
    };

    constructor(data = null) {
        this.geoLocation = _.get(data, 'geoLocation', {});
    }
}
