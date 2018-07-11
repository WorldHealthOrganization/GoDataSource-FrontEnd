import * as _ from 'lodash';
import { AddressModel } from './address.model';
import { ContactModel } from './contact.model';

export class FollowUpModel {
    date: string;
    performed: boolean;
    lostToFollowUp: boolean;
    address: AddressModel;
    personId: string;
    contact: ContactModel;

    constructor(data = null) {
        this.date = _.get(data, 'date');
        this.performed = _.get(data, 'performed');
        this.lostToFollowUp = _.get(data, 'lostToFollowUp');
        this.address = _.get(data, 'address');
        this.personId = _.get(data, 'personId');
        this.contact = _.get(data, 'contact', {});
    }
}
