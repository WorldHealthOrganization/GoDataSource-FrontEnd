import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  of,
  throwError
} from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { EventModel } from '../../models/event.model';
import { IBasicCount } from '../../models/basic-count.interface';
import {
  VisualIdErrorModel,
  VisualIdErrorModelCode
} from '../../models/visual-id-error.model';
import {
  catchError,
  map
} from 'rxjs/operators';
import { IGeneralAsyncValidatorResponse } from '../../../shared/xt-forms/validators/general-async-validator.directive';

@Injectable()
export class EventDataService {
  /**
   * Constructor
   */
  constructor(
    private http: HttpClient,
    private modelHelper: ModelHelperService
  ) {}

  /**
   * Retrieve the list of Events for an Outbreak
   */
  getEventsList(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder(),
    usePost?: boolean
  ): Observable<EventModel[]> {
    // use post
    if (usePost) {
      const filter = queryBuilder.buildQuery(false);
      return this.modelHelper.mapObservableListToModel(
        this.http.post(
          `outbreaks/${outbreakId}/events/filter`, {
            filter
          }
        ),
        EventModel
      );
    }

    // default
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableListToModel(
      this.http.get(`outbreaks/${outbreakId}/events?filter=${filter}`),
      EventModel
    );
  }

  /**
   * Return total number of events
   */
  getEventsCount(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<IBasicCount> {
    const filter = queryBuilder.buildQuery();
    return this.http.get(`outbreaks/${outbreakId}/events/filtered-count?filter=${filter}`);
  }

  /**
   * Add new Event to an existing Outbreak
   */
  createEvent(outbreakId: string, eventData): Observable<any> {
    return this.http.post(`outbreaks/${outbreakId}/events`, eventData);
  }

  /**
   * Retrieve an Event of an Outbreak
   */
  getEvent(
    outbreakId: string,
    eventId: string,
    retrieveCreatedUpdatedBy?: boolean
  ): Observable<EventModel> {
    return this.modelHelper.mapObservableToModel(
      this.http.get(`outbreaks/${outbreakId}/events/${eventId}${retrieveCreatedUpdatedBy ? '?retrieveCreatedUpdatedBy=1' : ''}`),
      EventModel
    );
  }

  /**
   * Modify an existing Event of an Outbreak
   */
  modifyEvent(
    outbreakId: string,
    eventId: string,
    eventData,
    retrieveCreatedUpdatedBy?: boolean
  ): Observable<EventModel> {
    return this.modelHelper.mapObservableToModel(
      this.http.put(`outbreaks/${outbreakId}/events/${eventId}${retrieveCreatedUpdatedBy ? '?retrieveCreatedUpdatedBy=1' : ''}`, eventData),
      EventModel
    );
  }

  /**
   * Delete an existing Event from Outbreak
   */
  deleteEvent(outbreakId: string, eventId: string): Observable<any> {
    return this.http.delete(`outbreaks/${outbreakId}/events/${eventId}`);
  }

  /**
   * Get exposed contacts for an event that user want to delete
   */
  getExposedContactsForEvent(outbreakId: string, caseId: string) {
    return this.http.get(`outbreaks/${outbreakId}/events/${caseId}/isolated-contacts`);
  }

  /**
   * Restore a deleted event
   */
  restoreEvent(outbreakId: string, eventId: string): Observable<any> {
    return this.http.post(`outbreaks/${outbreakId}/events/${eventId}/restore`, {});
  }

  /**
   * Get event relationships count
   */
  getEventRelationshipsCount(outbreakId: string, eventId: string): Observable<any> {
    return this.http.get(`outbreaks/${outbreakId}/events/${eventId}/relationships/filtered-count`);
  }

  /**
   * Generate Event Visual ID
   */
  generateEventVisualID(
    outbreakId: string,
    visualIdMask: string,
    personId?: string
  ): Observable<string | VisualIdErrorModel> {
    return this.http
      .post(
        `outbreaks/${outbreakId}/events/generate-visual-id`,
        {
          visualIdMask: visualIdMask,
          personId: personId
        }
      )
      .pipe(
        catchError((response: Error | VisualIdErrorModel) => {
          return (
            (response as VisualIdErrorModel).code === VisualIdErrorModelCode.INVALID_VISUAL_ID_MASK ||
            (response as VisualIdErrorModel).code === VisualIdErrorModelCode.DUPLICATE_VISUAL_ID
          ) ?
            of(
              this.modelHelper.getModelInstance(
                VisualIdErrorModel,
                response
              )
            ) :
            throwError(response);
        })
      );
  }

  /**
   * Check if visual ID is valid
   */
  checkEventVisualIDValidity(
    outbreakId: string,
    visualIdRealMask: string,
    visualIdMask: string,
    personId?: string
  ): Observable<boolean | IGeneralAsyncValidatorResponse> {
    return this.generateEventVisualID(
      outbreakId,
      visualIdMask,
      personId
    )
      .pipe(
        map((visualID: string | VisualIdErrorModel) => {
          return typeof visualID === 'string' ?
            true : {
              isValid: false,
              errMsg: (visualID as VisualIdErrorModel).code === VisualIdErrorModelCode.INVALID_VISUAL_ID_MASK ?
                'LNG_API_ERROR_CODE_INVALID_VISUAL_ID_MASK' :
                'LNG_API_ERROR_CODE_DUPLICATE_VISUAL_ID',
              errMsgData: {
                mask: visualIdRealMask
              }
            };
        })
      );
  }
}

