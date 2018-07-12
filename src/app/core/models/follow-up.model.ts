import * as _ from 'lodash';
import { AddressModel } from './address.model';
import { ContactModel } from './contact.model';

export class FollowUpModel {
    id: string;
    date: string;
    performed: boolean;
    lostToFollowUp: boolean;
    address: AddressModel;
    personId: string;
    contact: ContactModel;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.date = _.get(data, 'date');
        this.performed = _.get(data, 'performed', false);
        this.lostToFollowUp = _.get(data, 'lostToFollowUp', false);
        this.address = _.get(data, 'address', new AddressModel());
        this.personId = _.get(data, 'personId');
        this.contact = _.get(data, 'contact', {});
    }
}
