import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { CaseModel } from '../../../models/case.model';
import { ContactModel } from '../../../models/contact.model';
import { EventModel } from '../../../models/event.model';
import { Resolve } from '@angular/router';
import { ContactOfContactModel } from '../../../models/contact-of-contact.model';
import { StorageKey, StorageService } from '../../helper/storage.service';
import { ContactDataService } from '../../data/contact.data.service';
import { CaseDataService } from '../../data/case.data.service';
import { EventDataService } from '../../data/event.data.service';
import { ContactsOfContactsDataService } from '../../data/contacts-of-contacts.data.service';

@Injectable()
export class PersonDataResolver implements Resolve<CaseModel | ContactModel | EventModel | ContactOfContactModel> {
  /**
   * Constructor
   */
  constructor(
    private toastV2Service: ToastV2Service,
    private storageService: StorageService,
    private contactDataService: ContactDataService,
    private caseDataService: CaseDataService,
    private eventDataService: EventDataService,
    private contactsOfContactsDataService: ContactsOfContactsDataService
  ) {}

  /**
   * Retrieve data
   */
  resolve(route): Observable<CaseModel | ContactModel | EventModel | ContactOfContactModel> {
    // not found
    let request: Observable<CaseModel | ContactModel | EventModel | ContactOfContactModel> = of(null);

    // contact ?
    if (route.params.contactId) {
      request = this.contactDataService.getContact(
        this.storageService.get(StorageKey.SELECTED_OUTBREAK_ID),
        route.params.contactId
      );
    } else if (route.params.caseId) {
      request = this.caseDataService.getCase(
        this.storageService.get(StorageKey.SELECTED_OUTBREAK_ID),
        route.params.caseId
      );
    } else if (route.params.eventId) {
      request = this.eventDataService.getEvent(
        this.storageService.get(StorageKey.SELECTED_OUTBREAK_ID),
        route.params.eventId
      );
    } else if (route.params.contactOfContactId) {
      request = this.contactsOfContactsDataService.getContactOfContact(
        this.storageService.get(StorageKey.SELECTED_OUTBREAK_ID),
        route.params.contactOfContactId
      );
    }

    // retrieve
    return request
      .pipe(
        // should be last one
        catchError((err) => {
          // display error
          this.toastV2Service.error(err);

          // send error further
          return throwError(err);
        })
      );
  }
}
