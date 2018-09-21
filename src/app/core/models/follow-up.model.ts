
import * as _ from 'lodash';
import { AddressModel } from './address.model';
import { ContactModel } from './contact.model';
import { DateDefaultPipe } from '../../shared/pipes/date-default-pipe/date-default.pipe';

export class FollowUpModel {
    id: string;
    date: string;
    performed: boolean;
    lostToFollowUp: boolean;
    address: AddressModel;
    personId: string;
    contact: ContactModel;
    deleted: boolean;
    questionnaireAnswers: {};
    outbreakId: string;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.date = _.get(data, 'date');
        this.performed = _.get(data, 'performed', false);
        this.lostToFollowUp = _.get(data, 'lostToFollowUp', false);
        this.personId = _.get(data, 'personId');
        this.deleted = _.get(data, 'deleted');
        this.outbreakId = _.get(data, 'outbreakId');

        this.address = _.get(data, 'address', new AddressModel());
        this.address = new AddressModel(this.address);

        this.contact = _.get(data, 'contact', {});
        this.contact = new ContactModel(this.contact);

        this.questionnaireAnswers = _.get(data, 'questionnaireAnswers', {});
    }

    get dateFormatted() {
        const pD = new DateDefaultPipe();
        return pD.transform(this.date);
    }
}
