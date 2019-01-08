
import * as _ from 'lodash';
import { AddressModel } from './address.model';
import { ContactModel } from './contact.model';
import { DateDefaultPipe } from '../../shared/pipes/date-default-pipe/date-default.pipe';

export class FollowUpModel {
    id: string;
    date: string;
    address: AddressModel;
    personId: string;
    contact: ContactModel;
    deleted: boolean;
    targeted: boolean;
    questionnaireAnswers: {};
    outbreakId: string;
    statusId: string;
    teamId: string;
    index: number;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.date = _.get(data, 'date');
        this.personId = _.get(data, 'personId');
        this.deleted = _.get(data, 'deleted');
        this.targeted = _.get(data, 'targeted', true);
        this.statusId = _.get(data, 'statusId');
        this.outbreakId = _.get(data, 'outbreakId');

        this.address = new AddressModel(_.get(data, 'address'));

        this.contact = _.get(data, 'contact', {});
        this.contact = new ContactModel(this.contact);

        this.teamId = _.get(data, 'teamId');
        this.index = _.get(data, 'index');

        this.questionnaireAnswers = _.get(data, 'questionnaireAnswers', {});
    }

    get dateFormatted() {
        const pD = new DateDefaultPipe();
        return pD.transform(this.date);
    }
}
