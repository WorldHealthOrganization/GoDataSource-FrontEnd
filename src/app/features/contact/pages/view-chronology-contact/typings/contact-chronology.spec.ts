import { ContactModel } from '../../../../../core/models/contact.model';
import * as moment from 'moment';
import { ContactChronology } from './contact-chronology';
import * as _ from 'lodash';
import { FollowUpModel } from '../../../../../core/models/follow-up.model';
import { AddressModel } from '../../../../../core/models/address.model';
import { LocationModel } from '../../../../../core/models/location.model';
import { configureTestSuite, getObserverData, initializeFixture } from '../../../../../../test-helpers.spec';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewChronologyContactComponent } from '../view-chronology-contact.component';
import { OutbreakDataService } from '../../../../../core/services/data/outbreak.data.service';
import { OutbreakDataServiceMock } from '../../../../../core/services/data/outbreak.data.service.spec';
import { ContactDataService } from '../../../../../core/services/data/contact.data.service';
import { ContactDataServiceMock } from '../../../../../core/services/data/contact.data.service.spec';
import { ActivatedRoute } from '@angular/router';
import { ActivatedRouteMock } from '../../../../../core/services/helper/activated-route.service.spec';
import { FollowUpsDataService } from '../../../../../core/services/data/follow-ups.data.service';
import { FollowUpsDataServiceMock } from '../../../../../core/services/data/follow-ups.data.service.spec';

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

    // Conversion tests
    describe('Conversion tests', () => {
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

    // Component tests
    describe('Component tests', () => {
        // we don't actually need to reset TestBed, so we can setup it just once
        configureTestSuite();
        initializeFixture([
            ViewChronologyContactComponent
        ], [
            {provide: ActivatedRoute, useClass: ActivatedRouteMock},
            {provide: ContactDataService, useClass: ContactDataServiceMock},
            {provide: OutbreakDataService, useClass: OutbreakDataServiceMock},
            {provide: FollowUpsDataService, useClass: FollowUpsDataServiceMock}
        ]);

        // Handle fixture initialization
        let comp: ViewChronologyContactComponent;
        let fixture: ComponentFixture<ViewChronologyContactComponent>;
        beforeEach((done) => (async () => {
            fixture = TestBed.createComponent(ViewChronologyContactComponent);
            comp = fixture.componentInstance;
        })().then(done).catch(done.fail));

        it(`should have specific chronology items`, async(
            () => {
                fixture.detectChanges();
                fixture.whenStable().then(async () => {
                    // determine expected chronology items
                    const contactData: ContactModel = getObserverData(await ContactDataServiceMock.getInstance().getContact(OutbreakDataServiceMock.selectedOutbreakId, ContactDataServiceMock.selectedContactId));
                    const followUpsData: FollowUpModel[] = getObserverData(await FollowUpsDataServiceMock.getInstance().getContactFollowUpsList(OutbreakDataServiceMock.selectedOutbreakId, contactData.id));
                    const expectedChronologyItems = ContactChronology.getChronologyEntries(
                        contactData,
                        followUpsData
                    );

                    // make sure chronology items are the ones we expect
                    expect(_.isEqual(comp.chronologyEntries, expectedChronologyItems)).toBeTruthy();
                    console.log(JSON.stringify(expectedChronologyItems));
                    console.log(JSON.stringify(comp.chronologyEntries));
                });
            }
        ));
    });
});
