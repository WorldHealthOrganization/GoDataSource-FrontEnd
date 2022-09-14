import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ToastV2Service } from '../../helper/toast-v2.service';
import { IMapResolverV2, IResolverV2ResponseModel } from './models/resolver-response.model';
import { RequestQueryBuilder } from '../../../helperClasses/request-query-builder';
import { CaseModel } from '../../../models/case.model';
import { ContactModel } from '../../../models/contact.model';
import { EventModel } from '../../../models/event.model';
import { ContactOfContactModel } from '../../../models/contact-of-contact.model';
import { EntityDataService } from '../../data/entity.data.service';
import { StorageKey, StorageService } from '../../helper/storage.service';

@Injectable()
export class SelectedEntitiesDataResolver implements IMapResolverV2<CaseModel | ContactModel | EventModel | ContactOfContactModel> {
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
  resolve(activatedRoute): Observable<IResolverV2ResponseModel<CaseModel | ContactModel | EventModel | ContactOfContactModel>> {
    // no data to retrieve ?
    if (!activatedRoute.queryParams.selectedEntityIds) {
      return of({
        list: [],
        map: {},
        options: []
      });
    }

    // convert
    const selectedEntityIds: string[] = JSON.parse(activatedRoute.queryParams.selectedEntityIds);

    // construct query
    const qb = new RequestQueryBuilder();
    qb.fields(
      'id',
      'type',
      'firstName',
      'lastName',
      'middleName',
      'name'
    );

    // retrieve all selected entities
    qb.filter.where({
      id: {
        inq: selectedEntityIds
      }
    });

    // retrieve records
    return this.entityDataService
      .getEntitiesList(
        this.storageService.get(StorageKey.SELECTED_OUTBREAK_ID),
        qb
      )
      .pipe(
        map((data) => {
          // construct map
          const response: IResolverV2ResponseModel<CaseModel | ContactModel | EventModel | ContactOfContactModel> = {
            list: data,
            map: {},
            options: []
          };
          data.forEach((item) => {
            // map
            response.map[item.id] = item;

            // add option
            response.options.push({
              label: item.name,
              value: item.id,
              data: item
            });
          });

          // finished
          return response;
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
