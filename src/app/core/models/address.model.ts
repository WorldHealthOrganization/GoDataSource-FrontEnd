import * as _ from 'lodash';
import { LocationModel } from './location.model';

export class AddressModel {
    city: string;
    postalCode: string;
    addressLine1: string;
    locationId: string;
    location: LocationModel;

    constructor(data = null) {
        this.city = _.get(data, 'city');
        this.postalCode = _.get(data, 'postalCode');
        this.addressLine1 = _.get(data, 'addressLine1');
        this.locationId = _.get(data, 'locationId');
        this.location = _.get(data, 'location');
    }
}
