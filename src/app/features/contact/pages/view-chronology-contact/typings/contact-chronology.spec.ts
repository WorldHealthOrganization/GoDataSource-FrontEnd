import { ContactModel } from '../../../../../core/models/contact.model';
import * as moment from 'moment';
import { ContactChronology } from './contact-chronology';
import * as _ from 'lodash';

describe('ContactChronology', () => {
    const date = moment();
    const contact = new ContactModel({
        dateOfReporting: date,
        dateBecomeContact: date
    });
    const contactChronology = ContactChronology.getChronologyEntries(contact, []);

    it(`should show date of reporting`, () => {
        const item = _.find(contactChronology, {label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING'});
        expect(item).toBeTruthy();
    });

    it(`should show date of becoming a contact`, () => {
        const item = _.find(contactChronology, {label: 'LNG_CONTACT_FIELD_LABEL_DATE_BECOME_CONTACT'});
        expect(item).toBeTruthy();
    });
});
