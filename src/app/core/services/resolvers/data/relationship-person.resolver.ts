import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { CaseModel } from '../../../models/case.model';
import { ContactModel } from '../../../models/contact.model';
import { EventModel } from '../../../models/event.model';
import { EntityDataService } from '../../data/entity.data.service';
import { Resolve } from '@angular/router';
import { ContactOfContactModel } from '../../../models/contact-of-contact.model';
import { EntityType } from '../../../models/entity-type';
import { StorageKey, StorageService } from '../../helper/storage.service';

@Injectable()
export class RelationshipPersonDataResolver implements Resolve<CaseModel | ContactModel | EventModel | ContactOfContactModel> {
  /**
   * Constructor
   */
  constructor(
    private entityDataService: EntityDataService,
    private toastV2Service: ToastV2Service,
    private storageService: StorageService
  ) {}

  /**
   * Retrieve data
   */
  resolve(route): Observable<CaseModel | ContactModel | EventModel | ContactOfContactModel> {
    // retrieve data
    const entityType: EntityType = route.params.entityType || route.queryParams.entityType;
    const outbreakId: string = this.storageService.get(StorageKey.SELECTED_OUTBREAK_ID);
    const entityId: string = route.params.entityId || route.queryParams.entityId;

    // nothing to retrieve ?
    if (
      !entityType ||
      !outbreakId ||
      !entityId
    ) {
      return of(null);
    }

    // retrieve
    return this.entityDataService
      .getEntity(
        entityType,
        outbreakId,
        entityId
      )
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
