import * as _ from 'lodash';
import { FollowUpModel } from './follow-up.model';
import { CaseModel } from './case.model';
import { ContactModel } from './contact.model';
import { EventModel } from './event.model';
import { DateDefaultPipe } from '../../shared/pipes/date-default-pipe/date-default.pipe';
import { OutbreakModel } from './outbreak.model';
import { IPermissionBasic } from './permission.interface';

export class LocationUsageModel {
  followUp: FollowUpModel[];
  case: CaseModel[];
  contact: ContactModel[];
  event: EventModel[];

  constructor(data = null) {
    this.followUp = _.map(_.get(data, 'followUp', []), (followUpData) => {
      return new FollowUpModel(followUpData);
    });
    this.case = _.map(_.get(data, 'case', []), (caseData) => {
      return new CaseModel(caseData);
    });
    this.contact = _.map(_.get(data, 'contact', []), (contactData) => {
      return new ContactModel(contactData);
    });
    this.event = _.map(_.get(data, 'event', []), (eventData) => {
      return new EventModel(eventData);
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
  private _type: string;
  private _typePermissions: IPermissionBasic;
  set type(type: string) {
    this._type = type;
    switch (this.type) {
      case UsageDetailsItemType.FOLLOW_UP:
        this._typePermissions = FollowUpModel;
        break;
      case UsageDetailsItemType.EVENT:
        this._typePermissions = EventModel;
        break;
      case UsageDetailsItemType.CONTACT:
        this._typePermissions = ContactModel;
        break;
      case UsageDetailsItemType.CASE:
        this._typePermissions = CaseModel;
        break;
    }
  }
  get type(): string {
    return this._type;
  }
  get typePermissions(): IPermissionBasic {
    return this._typePermissions;
  }

  typeLabel: string;
  name: string;
  viewUrl: string;
  modifyUrl: string;
  outbreakId: string;
  outbreakName: string;

  constructor(data: {
    type: string,
    typeLabel: string,
    name: string,
    viewUrl: string,
    modifyUrl: string,
    outbreakId: string,
    outbreakName: string;
  }) {
    Object.assign(this, data);
  }
}

export class UsageDetails {
  items: UsageDetailsItem[] = [];

  constructor (
    data: LocationUsageModel,
    outbreaks: {
      [ id: string ]: OutbreakModel
    }
  ) {
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
        outbreakId: followUp.outbreakId,
        outbreakName: outbreaks[followUp.outbreakId] ? outbreaks[followUp.outbreakId].name : ''
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
        outbreakId: event.outbreakId,
        outbreakName: outbreaks[event.outbreakId] ? outbreaks[event.outbreakId].name : ''
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
        outbreakId: contact.outbreakId,
        outbreakName: outbreaks[contact.outbreakId] ? outbreaks[contact.outbreakId].name : ''
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
        outbreakId: caseM.outbreakId,
        outbreakName: outbreaks[caseM.outbreakId] ? outbreaks[caseM.outbreakId].name : ''
      }));
    });
  }
}
