import { ContactModel } from '../../../../../core/models/contact.model';
import * as moment from 'moment';
import { ContactChronology } from './contact-chronology';
import * as _ from 'lodash';

describe('ContactChronology', () => {
    const date = moment();
    const contact = new ContactModel({
        dateOfReporting: date,
        followUp : {
            startDate: date,
            endDate: date
        },
        dateBecomeContact: date,
        dateOfLastContact: date,
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

    it(`should show follow up start date`, () => {
        const item = _.find(contactChronology, {label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_START_OF_FOLLOWUP'});
        expect(item).toBeTruthy();
    });

    it(`should show follow up end date`, () => {
        const item = _.find(contactChronology, {label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_END_OF_FOLLOWUP'});
        expect(item).toBeTruthy();
    });

    it(`should show date of last contact`, () => {
        const item = _.find(contactChronology, {label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT'});
        expect(item).toBeTruthy();
    });
});
