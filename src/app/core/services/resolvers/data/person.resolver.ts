import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
import { RequestQueryBuilder } from '../../../helperClasses/request-query-builder';

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
    let request: Observable<CaseModel[] | ContactModel[] | EventModel[] | ContactOfContactModel[]>;

    // determine id
    const id: string = route.params.contactId ||
      route.queryParams.contactId ||
      route.params.caseId ||
      route.queryParams.caseId ||
      route.params.eventId ||
      route.queryParams.eventId ||
      route.params.contactOfContactId ||
      route.queryParams.contactOfContactId;

    // nothing to retrieve ?
    if (!id) {
      return of(null);
    }

    // construct query builder to include deleted records
    const qb = new RequestQueryBuilder();

    // retrieve our record
    qb.filter.where({
      id
    });

    // include deleted
    qb.includeDeleted();

    // we can't have more than 1 with same id :)
    qb.limit(1);

    // contact ?
    if (
      route.params.contactId ||
      route.queryParams.contactId
    ) {
      request = this.contactDataService.getContactsList(
        this.storageService.get(StorageKey.SELECTED_OUTBREAK_ID),
        qb
      );
    } else if (
      route.params.caseId ||
      route.queryParams.caseId
    ) {
      // request
      request = this.caseDataService.getCasesList(
        this.storageService.get(StorageKey.SELECTED_OUTBREAK_ID),
        qb
      );
    } else if (
      route.params.eventId ||
      route.queryParams.eventId
    ) {
      // request
      request = this.eventDataService.getEventsList(
        this.storageService.get(StorageKey.SELECTED_OUTBREAK_ID),
        qb
      );
    } else if (
      route.params.contactOfContactId ||
      route.queryParams.contactOfContactId
    ) {
      // request
      request = this.contactsOfContactsDataService.getContactsOfContactsList(
        this.storageService.get(StorageKey.SELECTED_OUTBREAK_ID),
        qb
      );
    }

    // retrieve
    return request
      .pipe(
        map((data) => {
          return data?.length > 0 ?
            data[0] :
            null;
        }),

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
