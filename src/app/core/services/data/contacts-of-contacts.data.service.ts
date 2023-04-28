import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { HttpClient } from '@angular/common/http';
import { ModelHelperService } from '../helper/model-helper.service';
import { ContactOfContactModel } from '../../models/contact-of-contact.model';
import { AddressModel } from '../../models/address.model';
import { RiskLevelGroupModel } from '../../models/risk-level-group.model';
import { VisualIdErrorModel, VisualIdErrorModelCode } from '../../models/visual-id-error.model';
import { IGeneralAsyncValidatorResponse } from '../../../shared/xt-forms/validators/general-async-validator.directive';
import * as _ from 'lodash';
import { IBasicCount } from '../../models/basic-count.interface';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class ContactsOfContactsDataService {
  /**
   * Constructor
   */
  constructor(
    private http: HttpClient,
    private modelHelper: ModelHelperService
  ) {}

  /**
   * Retrieve the list of Contacts of contacts for an Outbreak
   */
  getContactsOfContactsList(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder(),
    usePost?: boolean
  ): Observable<ContactOfContactModel[]> {
    // use post
    if (usePost) {
      const filter = queryBuilder.buildQuery(false);
      return this.modelHelper.mapObservableListToModel(
        this.http.post(
          `outbreaks/${outbreakId}/contacts-of-contacts/filter`, {
            filter
          }
        ),
        ContactOfContactModel
      );
    }

    // default
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableListToModel(
      this.http.get(`outbreaks/${outbreakId}/contacts-of-contacts?filter=${filter}`),
      ContactOfContactModel
    );
  }

  /**
   * Return total number of contacts of contacts
   */
  getContactsOfContactsCount(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<IBasicCount> {
    const filter = queryBuilder.buildQuery();
    return this.http.get(`outbreaks/${outbreakId}/contacts-of-contacts/filtered-count?filter=${filter}`);
  }

  /**
   * Delete an existing Contact of contact of an Outbreak
   */
  deleteContactOfContact(outbreakId: string, contactOfContactId: string): Observable<any> {
    return this.http.delete(`outbreaks/${outbreakId}/contacts-of-contacts/${contactOfContactId}`);
  }

  /**
   * Add a new Contact of contact for an Outbreak
   */
  createContactOfContact(outbreakId: string, contactOfContactData): Observable<any> {
    return this.http.post(`outbreaks/${outbreakId}/contacts-of-contacts`, contactOfContactData);
  }

  /**
   * Retrieve a Contact of contact of an Outbreak
   */
  getContactOfContact(
    outbreakId: string,
    contactOfContactId: string,
    retrieveCreatedUpdatedBy?: boolean
  ): Observable<ContactOfContactModel> {
    return this.modelHelper.mapObservableToModel(
      this.http.get(`outbreaks/${outbreakId}/contacts-of-contacts/${contactOfContactId}${retrieveCreatedUpdatedBy ? '?retrieveCreatedUpdatedBy=1' : ''}`),
      ContactOfContactModel
    );
  }

  /**
   * Retrieve Contact of contact movement information
   */
  getContactOfContactMovement(
    outbreakId: string,
    contactOfContactId: string
  ): Observable<AddressModel[]> {
    return this.modelHelper.mapObservableListToModel(
      this.http.get(`outbreaks/${outbreakId}/contacts-of-contacts/${contactOfContactId}/movement`),
      AddressModel
    );
  }

  /**
   * Modify an existing Contact of contact of an Outbreak
   */
  modifyContactOfContact(
    outbreakId: string,
    contactOfContactId: string,
    contactOfContactData,
    retrieveCreatedUpdatedBy?: boolean
  ): Observable<ContactOfContactModel> {
    return this.modelHelper.mapObservableToModel(
      this.http.put(`outbreaks/${outbreakId}/contacts-of-contacts/${contactOfContactId}${retrieveCreatedUpdatedBy ? '?retrieveCreatedUpdatedBy=1' : ''}`, contactOfContactData),
      ContactOfContactModel
    );
  }

  /**
   * Add multiple Contacts of Contacts for Contact
   */
  bulkAddContactsOfContacts(
    outbreakId: string,
    sourceEntityId: string,
    contactsOfContactsData: any[]
  ): Observable<any> {
    return this.http.post(`outbreaks/${outbreakId}/contacts/${sourceEntityId}/contacts-of-contacts`, contactsOfContactsData);
  }

  /**
   * Modify multiple contacts of contacts
   */
  bulkModifyContactsOfContacts(
    outbreakId: string,
    contactsOfContactsData: any
  ) {
    return this.http.put(
      `outbreaks/${outbreakId}/contacts-of-contacts/bulk`,
      contactsOfContactsData
    );
  }

  /**
   * Retrieve the list of contacts of contacts grouped by the risk level
   */
  getContactsOfContactsGroupedByRiskLevel(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
  ): Observable<RiskLevelGroupModel> {
    const filter = queryBuilder.buildQuery();
    return this.modelHelper.mapObservableToModel(
      this.http.get(`outbreaks/${outbreakId}/contacts-of-contacts/per-risk-level/count?filter=${filter}`),
      RiskLevelGroupModel
    );
  }

  /**
   * Restore a contact of contact that was deleted
   */
  restoreContactOfContact(outbreakId: string, contactOfContactId: string): Observable<any> {
    return this.http.post(`/outbreaks/${outbreakId}/contacts-of-contacts/${contactOfContactId}/restore`, {});
  }

  /**
   * Generate Contact of contact Visual ID
   */
  generateContactOfContactVisualID(
    outbreakId: string,
    visualIdMask: string,
    personId?: string
  ): Observable<string | VisualIdErrorModel> {
    return this.http
      .post(
        `outbreaks/${outbreakId}/contacts-of-contacts/generate-visual-id`,
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
  checkContactOfContactVisualIDValidity(
    outbreakId: string,
    visualIdRealMask: string,
    visualIdMask: string,
    personId?: string
  ): Observable<boolean | IGeneralAsyncValidatorResponse> {
    return this.generateContactOfContactVisualID(
      outbreakId,
      visualIdMask,
      personId
    )
      .pipe(
        map((visualID: string | VisualIdErrorModel) => {
          return _.isString(visualID) ?
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
