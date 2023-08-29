import { Injectable } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { AuthDataService } from '../data/auth.data.service';
import { CaseDataService } from '../data/case.data.service';
import { CaseHelperModel } from './models/case-helper.model';
import { RelationshipHelperModel } from './models/relationship-helper.model';
import { DialogV2Service } from './dialog-v2.service';
import { ToastV2Service } from './toast-v2.service';
import { I18nService } from './i18n.service';
import { RedirectService } from './redirect.service';
import { CreateViewModifyHelperModel } from './models/create-view-modify-helper.model';
import { ListHelperModel } from './models/list-helper.model';
import { RelationshipDataService } from '../data/relationship.data.service';
import { ContactHelperModel } from './models/contact-helper.model';
import { ContactDataService } from '../data/contact.data.service';
import { FollowUpHelperModel } from './models/follow-up-helper.model';
import { LocationDataService } from '../data/location.data.service';
import { LabResultHelperModel } from './models/lab-result-helper.model';
import { FollowUpsDataService } from '../data/follow-ups.data.service';
import { LabResultDataService } from '../data/lab-result.data.service';
import { EventHelperModel } from './models/event-helper.model';
import { EventDataService } from '../data/event.data.service';
import { ContactOfContactHelperModel } from './models/contact-of-contact-helper.model';
import { ContactsOfContactsDataService } from '../data/contacts-of-contacts.data.service';

@Injectable({
  providedIn: 'root'
})
export class PersonAndRelatedHelperService {
  // data
  public readonly authUser: UserModel;
  public readonly list: ListHelperModel;
  public readonly createViewModify: CreateViewModifyHelperModel;
  public readonly case: CaseHelperModel;
  public readonly event: EventHelperModel;
  public readonly contact: ContactHelperModel;
  public readonly contactOfContact: ContactOfContactHelperModel;
  public readonly relationship: RelationshipHelperModel;
  public readonly followUp: FollowUpHelperModel;
  public readonly labResult: LabResultHelperModel;

  /**
   * Constructor
   */
  constructor(
    authDataService: AuthDataService,
    caseDataService: CaseDataService,
    eventDataService: EventDataService,
    contactDataService: ContactDataService,
    contactsOfContactsDataService: ContactsOfContactsDataService,
    relationshipDataService: RelationshipDataService,
    followUpsDataService: FollowUpsDataService,
    labResultDataService: LabResultDataService,
    public dialogV2Service: DialogV2Service,
    public i18nService: I18nService,
    public toastV2Service: ToastV2Service,
    public redirectService: RedirectService,
    public locationDataService: LocationDataService
  ) {
    // get the authenticated user
    this.authUser = authDataService.getAuthenticatedUser();

    // helpers - list
    this.list = new ListHelperModel();

    // helpers - createViewModify
    this.createViewModify = new CreateViewModifyHelperModel(
      this
    );

    // helpers - case
    this.case = new CaseHelperModel(
      this,
      caseDataService
    );

    // helpers - event
    this.event = new EventHelperModel(
      this,
      eventDataService
    );

    // helpers - contact
    this.contact = new ContactHelperModel(
      this,
      contactDataService
    );

    // helpers - contact of contact
    this.contactOfContact = new ContactOfContactHelperModel(
      this,
      contactsOfContactsDataService
    );

    // helpers - relationship
    this.relationship = new RelationshipHelperModel(
      this,
      relationshipDataService
    );

    // helpers - follow-up
    this.followUp = new FollowUpHelperModel(
      this,
      followUpsDataService
    );

    // helpers - lab result
    this.labResult = new LabResultHelperModel(
      this,
      labResultDataService
    );
  }
}
