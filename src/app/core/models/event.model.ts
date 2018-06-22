import * as _ from 'lodash';
import { AddressModel } from './address.model';

export class EventModel {
    id: string;
    firstName: string;
    lastName: string;
    dateOfOnset: string;
    description: string;
    addresses: AddressModel[];

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.firstName = _.get(data, 'firstName');
        this.lastName = _.get(data, 'lastName');
        this.dateOfOnset = _.get(data, 'dateOfOnset');
        this.description = _.get(data, 'description');
        this.addresses = _.get(data, 'addresses', []);

        if (_.get(data, 'name')) {
            this.name = _.get(data, 'name');
        }
    }

    get name(): string {
        return this.lastName;
    }

    set name(value: string) {
        this.firstName = value;
        this.lastName = value;
    }

    get date(): string {
        return this.dateOfOnset;
    }

    set date(value: string) {
        this.dateOfOnset = value;
    }
}
