import * as _ from 'lodash';
import { FollowUpModel } from './follow-up.model';
import { CaseModel } from './case.model';
import { ContactModel } from './contact.model';
import { EventModel } from './event.model';
import { DateDefaultPipe } from '../../shared/pipes/date-default-pipe/date-default.pipe';

export class LocationUsageModel {
    followUp: FollowUpModel[];
    case: CaseModel[];
    contact: ContactModel[];
    event: EventModel[];

    constructor(data = null) {
        this.followUp = _.map(_.get(data, 'followUp', []), (dataC) => {
            return new FollowUpModel(dataC);
        });
        this.case = _.map(_.get(data, 'case', []), (dataC) => {
            return new CaseModel(dataC);
        });
        this.contact = _.map(_.get(data, 'contact', []), (dataC) => {
            return new ContactModel(dataC);
        });
        this.event = _.map(_.get(data, 'event', []), (dataC) => {
            return new EventModel(dataC);
        });
    }
}

export enum UsageDetailsItemType {
    FOLLOW_UP = 'follow-up',
    EVENT = 'event',
    CONTACT = 'contact',
    CASE = 'case'
}

export class UsageDetailsItem {
    type: string;
    typeLabel: string;
    name: string;
    viewUrl: string;
    modifyUrl: string;
    outbreakId: string;

    constructor(data: {
        type: string,
        typeLabel: string,
        name: string,
        viewUrl: string,
        modifyUrl: string,
        outbreakId: string
    }) {
        Object.assign(this, data);
    }
}

export class UsageDetails {
    items: UsageDetailsItem[] = [];

    constructor (data: LocationUsageModel) {
        // general stuff
        const dateFormatter = new DateDefaultPipe();

        // follow-ups
        _.each(data.followUp, (followUp: FollowUpModel) => {
            this.items.push(new UsageDetailsItem({
                type: UsageDetailsItemType.FOLLOW_UP,
                typeLabel: 'LNG_PAGE_LIST_USAGE_LOCATIONS_TYPE_LABEL_FOLLOW_UP',
                name: followUp.date ? dateFormatter.transform(followUp.date) : '',
                viewUrl: `/contacts/${followUp.personId}/follow-ups/${followUp.id}/view`,
                modifyUrl: `/contacts/${followUp.personId}/follow-ups/${followUp.id}/modify`,
                outbreakId: followUp.outbreakId
            }));
        });

        // events
        _.each(data.event, (event: EventModel) => {
            this.items.push(new UsageDetailsItem({
                type: UsageDetailsItemType.EVENT,
                typeLabel: 'LNG_PAGE_LIST_USAGE_LOCATIONS_TYPE_LABEL_EVENT',
                name: event.name,
                viewUrl: `/events/${event.id}/view`,
                modifyUrl: `/events/${event.id}/modify`,
                outbreakId: event.outbreakId
            }));
        });

        // contacts
        _.each(data.contact, (contact: ContactModel) => {
            this.items.push(new UsageDetailsItem({
                type: UsageDetailsItemType.CONTACT,
                typeLabel: 'LNG_PAGE_LIST_USAGE_LOCATIONS_TYPE_LABEL_CONTACT',
                name: contact.name,
                viewUrl: `/contacts/${contact.id}/view`,
                modifyUrl: `/contacts/${contact.id}/modify`,
                outbreakId: contact.outbreakId
            }));
        });

        // cases
        _.each(data.case, (caseM: CaseModel) => {
            this.items.push(new UsageDetailsItem({
                type: UsageDetailsItemType.CASE,
                typeLabel: 'LNG_PAGE_LIST_USAGE_LOCATIONS_TYPE_LABEL_CASE',
                name: caseM.name,
                viewUrl: `/cases/${caseM.id}/view`,
                modifyUrl: `/cases/${caseM.id}/modify`,
                outbreakId: caseM.outbreakId
            }));
        });
    }
}
