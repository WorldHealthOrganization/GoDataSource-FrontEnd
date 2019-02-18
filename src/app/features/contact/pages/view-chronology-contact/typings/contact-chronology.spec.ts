import { ContactModel } from '../../../../../core/models/contact.model';
import * as moment from 'moment';
import { ContactChronology } from './contact-chronology';
import * as _ from 'lodash';
import { FollowUpModel } from '../../../../../core/models/follow-up.model';
import { AddressModel } from '../../../../../core/models/address.model';
import { LocationModel } from '../../../../../core/models/location.model';

describe('ContactChronology', () => {
    const date = moment();
    const followUps: FollowUpModel[] =
        [
            new FollowUpModel({
                id: '12121212wer1212',
                date: moment(),
                address: AddressModel,
                personId: '12334234234tr53245',
                contact: ContactModel,
                deleted: true,
                targeted: false,
                questionnaireAnswers: {},
                outbreakId: 'sdfsg3wdf2qet34fwf',
                statusId: '4dwfsdfweer32423',
                teamId: 'sdfsrewtefgert',
                index: 4,
            }),
            new FollowUpModel({
                id: '121212121212',
                date: moment(),
                address: new AddressModel({
                    typeId: 'asdasd',
                    city: 'asdasdasdasd',
                    postalCode: '23423',
                    addressLine1: 'sdfsdfsdfs',
                    locationId: 'dfdg432fdsf',
                    location: LocationModel,
                    date: moment(),
                    geoLocation: { lat: 1, lng: 2},
                    geoLocationAccurate: false,
                }),
                personId: '1233423ggfg423453245',
                contact: ContactModel,
                deleted: false,
                targeted: true,
                questionnaireAnswers: {},
                outbreakId: 'sdfsg3wdffdg234fwf',
                statusId: '4dwfsdfsdfwer32423',
                teamId: 'dffdgf',
                index: 2,
            }),
            new FollowUpModel({
                id: '121212121212',
                date: moment(),
                address: new AddressModel({
                    typeId: 'asdasd',
                    city: 'asdasdasdasd',
                    postalCode: '23423',
                    addressLine1: 'sdfsdfsdfs',
                    locationId: 'dfdg432fdsf',
                    location: LocationModel,
                    date: moment(),
                    geoLocation: { lat: 4, lng: 5 },
                    geoLocationAccurate: false,
                }),
                personId: '1233423423453245',
                contact: ContactModel,
                deleted: true,
                targeted: false,
                questionnaireAnswers: {},
                outbreakId: 'sdfsg3wsdddf234fwf',
                statusId: '4dwfsdfwer32423',
                teamId: 'sdfsrewtert',
                index: 1,
            }),
        ];
    const contact = new ContactModel({
        dateOfReporting: date,
        followUp : {
            startDate: date,
            endDate: date
        },
        dateBecomeContact: date,
        dateOfLastContact: date,
    });
    const contactChronology = ContactChronology.getChronologyEntries(contact, followUps);

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
