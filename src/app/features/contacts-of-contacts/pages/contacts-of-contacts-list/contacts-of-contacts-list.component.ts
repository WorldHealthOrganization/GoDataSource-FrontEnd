import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import * as _ from 'lodash';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';

import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { moment } from '../../../../core/helperClasses/x-moment';
import { AddressModel } from '../../../../core/models/address.model';
import { Constants } from '../../../../core/models/constants';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { EntityType } from '../../../../core/models/entity-type';
import { ExportFieldsGroupModelNameEnum } from '../../../../core/models/export-fields-group.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { LocationModel } from '../../../../core/models/location.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ExportDataMethod, IV2ExportDataConfigGroupsRequired } from '../../../../core/services/helper/models/dialog-v2.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { V2AdvancedFilterType } from '../../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { IV2ColumnPinned, IV2ColumnStatusFormType, V2ColumnFormat, V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { IV2GroupedData } from '../../../../shared/components-v2/app-list-table-v2/models/grouped-data.model';
import { FilterModel } from '../../../../shared/components/side-filters/model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';

@Component({
  selector: 'app-contacts-of-contacts-list',
  templateUrl: './contacts-of-contacts-list.component.html'
})
export class ContactsOfContactsListComponent extends ListComponent implements OnDestroy {
  // list of existing contacts
  contactsOfContactsList$: Observable<ContactOfContactModel[]>;

  // available side filters
  availableSideFilters: FilterModel[];

  // constants
  Constants = Constants;
  UserSettings = UserSettings;


  // anonymize fields
  private contactsOfContactsAnonymizeFields: ILabelValuePairModel[] = [
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME', value: 'firstName' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RELATIONSHIP', value: 'relationship' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_MIDDLE_NAME', value: 'middleName' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME', value: 'lastName' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER', value: 'gender' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION', value: 'occupation' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE', value: 'age' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOB', value: 'dob' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOCUMENTS', value: 'documents' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING', value: 'dateOfReporting' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT', value: 'dateOfLastContact' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL', value: 'riskLevel' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_REASON', value: 'riskReason' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OUTCOME_ID', value: 'outcomeId' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_OUTCOME', value: 'dateOfOutcome' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID', value: 'visualId' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_TYPE', value: 'type' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_NUMBER_OF_EXPOSURES', value: 'numberOfExposures' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESSES', value: 'addresses' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_IS_DATE_OF_REPORTING_APPROXIMATE', value: 'isDateOfReportingApproximate' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_SAFE_BURIAL', value: 'safeBurial' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_BURIAL', value: 'dateOfBurial' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VACCINES_RECEIVED', value: 'vaccinesReceived' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PREGNANCY_STATUS', value: 'pregnancyStatus' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID', value: 'responsibleUserId' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', value: 'createdAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', value: 'createdBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', value: 'updatedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', value: 'updatedBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED', value: 'deleted' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', value: 'deletedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', value: 'createdOn' },
    { label: 'LNG_CONTACT_FIELD_LABEL_DATE_BECOME_CONTACT', value: 'dateBecomeContact' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ID', value: 'id' }
  ];
  private relationshipAnonymizeFields: LabelValuePair[] = [
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_ID', 'id'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_SOURCE', 'sourcePerson'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_TARGET', 'targetPerson'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_DATE_OF_FIRST_CONTACT', 'dateOfFirstContact'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE', 'contactDate'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED', 'contactDateEstimated'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL', 'certaintyLevelId'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE', 'exposureTypeId'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY', 'exposureFrequencyId'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION', 'exposureDurationId'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_RELATION', 'socialRelationshipTypeId'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_RELATION_DETAIL', 'socialRelationshipDetail'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER', 'clusterId'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_COMMENT', 'comment'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', 'createdAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', 'createdBy'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', 'updatedAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', 'updatedBy'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_DELETED', 'deleted'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', 'deletedAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', 'createdOn')
  ];

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private contactsOfContactsDataService: ContactsOfContactsDataService,
    private toastV2Service: ToastV2Service,
    private outbreakDataService: OutbreakDataService,
    private i18nService: I18nService,
    private locationDataService: LocationDataService,
    private dialogV2Service: DialogV2Service,
    private activatedRoute: ActivatedRoute,
    private entityHelperService: EntityHelperService
  ) {
    super(listHelperService);
  }

  /**
     * Component destroyed
     */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
  }

  /**
   * Selected outbreak was changed
   */
  selectedOutbreakChanged(): void {
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns() {
    // address model used to search by phone number, address line, postal code, city....
    const filterAddressModel: AddressModel = new AddressModel({
      geoLocationAccurate: ''
    });

    this.tableColumns = [
      {
        field: 'lastName',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME',
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'middleName',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_MIDDLE_NAME',
        notVisible: true,
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'firstName',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME',
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'visualId',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'statuses',
        label: 'LNG_COMMON_LABEL_STATUSES',
        format: {
          type: V2ColumnFormat.STATUS
        },
        notResizable: true,
        pinned: true,
        legends: [
          // risk
          {
            title: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL',
            items: (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).list.map((item) => {
              return {
                form: {
                  type: IV2ColumnStatusFormType.TRIANGLE,
                  color: item.getColorCode()
                },
                label: item.id
              };
            })
          }
        ],
        forms: (_column, data: ContactOfContactModel): V2ColumnStatusForm[] => {
          // construct list of forms that we need to display
          const forms: V2ColumnStatusForm[] = [];

          // risk
          const risk = this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>;
          if (
            data.id &&
            risk.map[data.id]
          ) {
            forms.push({
              type: IV2ColumnStatusFormType.TRIANGLE,
              color: risk.map[data.id].getColorCode(),
              tooltip: this.i18nService.instant(data.riskLevel)
            });
          }

          // finished
          return forms;
        }
      },
      {
        field: 'location',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESS_LOCATION',
        format: {
          type: 'mainAddress.location.name'
        },
        filter: {
          type: V2FilterType.ADDRESS_MULTIPLE_LOCATION,
          address: filterAddressModel,
          field: 'addresses',
          fieldIsArray: true
        },
        link: (data) => {
          return data.mainAddress?.location?.name
            ? `/locations/${data.mainAddress.location.id}/view`
            : undefined;
        }
      },
      {
        field: 'addresses.addressLine1',
        label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1',
        notVisible: true,
        format: {
          type: 'mainAddress.addressLine1'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'addressLine1',
          field: 'addresses',
          fieldIsArray: true
        }
      },
      {
        field: 'addresses.city',
        label: 'LNG_ADDRESS_FIELD_LABEL_CITY',
        notVisible: true,
        format: {
          type: 'mainAddress.city'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'city',
          field: 'addresses',
          fieldIsArray: true
        },
        sortable: true
      },
      {
        field: 'addresses.emailAddress',
        label: 'LNG_CONTACT_FIELD_LABEL_EMAIL',
        notVisible: true,
        format: {
          type: 'mainAddress.emailAddress'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'emailAddress',
          field: 'addresses',
          fieldIsArray: true
        },
        sortable: true
      },
      {
        field: 'addresses.geoLocation.lat',
        label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LAT',
        notVisible: true,
        format: {
          type: 'mainAddress.geoLocation.lat'
        }
      },
      {
        field: 'addresses.geoLocation.lng',
        label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LNG',
        notVisible: true,
        format: {
          type: 'mainAddress.geoLocation.lng'
        }
      },
      {
        field: 'addresses.postalCode',
        label: 'LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE',
        notVisible: true,
        format: {
          type: 'mainAddress.postalCode'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'postalCode',
          field: 'addresses',
          fieldIsArray: true
        },
        sortable: true
      },
      {
        field: 'addresses.geoLocationAccurate',
        label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_GEO_LOCATION_ACCURATE',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN,
          field: 'mainAddress.geoLocationAccurate'
        },
        filter: {
          type: V2FilterType.ADDRESS_ACCURATE_GEO_LOCATION,
          address: filterAddressModel,
          field: 'addresses',
          fieldIsArray: true,
          options: (this.activatedRoute.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options
        },
        sortable: true
      },
      {
        field: 'age',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE',
        format: {
          type: V2ColumnFormat.AGE
        },
        sortable: true,
        filter: {
          type: V2FilterType.AGE_RANGE,
          min: 0,
          max: Constants.DEFAULT_AGE_MAX_YEARS
        }
      },
      {
        field: 'gender',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'phoneNumber',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PHONE_NUMBER',
        format: {
          type: 'mainAddress.phoneNumber'
        },
        sortable: true,
        filter: {
          type: V2FilterType.ADDRESS_PHONE_NUMBER,
          address: filterAddressModel,
          field: 'addresses',
          fieldIsArray: true
        }
      },
      {
        field: 'riskLevel',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL',
        sortable: true
      },
      {
        field: 'dateOfLastContact',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT',
        sortable: true
      },
      {
        field: 'responsibleUserId',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID',
        notVisible: true,
        format: {
          type: 'responsibleUser.name'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
        },
        exclude: (): boolean => {
          return !UserModel.canList(this.authUser);
        },
        link: (data) => {
          return data.responsibleUserId ?
            `/users/${data.responsibleUserId}/view` :
            undefined;
        }
      },
      {
        field: 'numberOfExposures',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
        format: {
          type: V2ColumnFormat.BUTTON
        },
        filter: {
          type: V2FilterType.NUMBER_RANGE,
          min: 0
        },
        sortable: true,
        cssCellClass: 'gd-cell-button',
        buttonLabel: (item) => (item.numberOfExposures || '').toLocaleString('en'),
        color: 'text',
        click: (item) => {
          // if we do not have exposures return
          if (item.numberOfExposures < 1) {
            return;
          }

          // display dialog
          this.entityHelperService.exposures(
            this.selectedOutbreak,
            item
          );
        },
        disabled: (data) => !RelationshipModel.canList(this.authUser) || !data.canListRelationshipExposures(this.authUser)
      },
      {
        field: 'deleted',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DELETED',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        },
        filter: {
          type: V2FilterType.DELETED,
          value: false
        },
        sortable: true
      },
      {
        field: 'createdBy',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_CREATED_BY',
        notVisible: true,
        format: {
          type: 'createdByUser.name'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
        },
        link: (data) => {
          return data.createdBy ?
            `/users/${data.createdBy}/view` :
            undefined;
        }
      },
      {
        field: 'createdAt',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_CREATED_AT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true
      },
      {
        field: 'updatedBy',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_UPDATED_BY',
        notVisible: true,
        format: {
          type: 'updatedByUser.name'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
        },
        link: (data) => {
          return data.updatedBy ?
            `/users/${data.updatedBy}/view` :
            undefined;
        }
      },
      {
        field: 'updatedAt',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_UPDATED_AT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true
      },

      // actions
      {
        field: 'actions',
        label: 'LNG_COMMON_LABEL_ACTIONS',
        pinned: IV2ColumnPinned.RIGHT,
        notResizable: true,
        cssCellClass: 'gd-cell-no-focus',
        format: {
          type: V2ColumnFormat.ACTIONS
        },
        actions: [
          // View Contact of contact
          {
            type: V2ActionType.ICON,
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_VIEW_CONTACT_OF_CONTACT',
            action: {
              link: (data: ContactOfContactModel): string[] => {
                return ['/contacts-of-contacts', data.id, 'view'];
              }
            },
            visible: (item: ContactOfContactModel): boolean => {
              return !item.deleted &&
              ContactOfContactModel.canView(this.authUser);
            }
          },

          // Modify Contact of contact
          {
            type: V2ActionType.ICON,
            icon: 'edit',
            iconTooltip: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_MODIFY_CONTACT_OF_CONTACT',
            action: {
              link: (item: ContactOfContactModel): string[] => {
                return ['/contacts-of-contacts', item.id, 'modify'];
              }
            },
            visible: (item: ContactOfContactModel): boolean => {
              return !item.deleted &&
                this.selectedOutbreakIsActive &&
                ContactOfContactModel.canModify(this.authUser);
            }
          },

          // Other actions
          {
            type: V2ActionType.MENU,
            icon: 'more_horiz',
            menuOptions: [
              // Delete Contact of contact
              {
                label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_DELETE_CONTACT_OF_CONTACT',
                cssClasses: 'gd-list-table-actions-action-menu-warning',
                action: {
                  click: (item: ContactOfContactModel): void => {
                    // data
                    const message: {
                      get: string,
                      data?: {
                        name: string,
                      }
                    } = {
                      get: ''
                    };

                    // determine what we need to delete
                    this.dialogV2Service.showConfirmDialog({
                      config: {
                        title: {
                          get: () => 'LNG_COMMON_LABEL_DELETE',
                          data: () => ({
                            name: item.name
                          })
                        },
                        message: {
                          get: () => message.get,
                          data: () => message.data
                        }
                      },
                      initialized: (handler) => {
                        // display loading
                        handler.loading.show();

                        // set message data
                        message.data = {
                          name: item.name
                        };

                        // determine message label
                        message.get = 'LNG_DIALOG_CONFIRM_DELETE_CONTACT_OF_CONTACT';

                        // hide loading
                        handler.loading.hide();
                      }
                    }).subscribe((response) => {
                      // canceled ?
                      if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                        // finished
                        return;
                      }

                      // show loading
                      const loading = this.dialogV2Service.showLoadingDialog();

                      // delete Contact of contact
                      this.contactsOfContactsDataService
                        .deleteContactOfContact(
                          this.selectedOutbreak.id,
                          item.id
                        )
                        .pipe(
                          catchError((err) => {
                            // show error
                            this.toastV2Service.error(err);

                            // hide loading
                            loading.close();

                            // send error down the road
                            return throwError(err);
                          })
                        )
                        .subscribe(() => {
                          // success
                          this.toastV2Service.success('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_DELETE_SUCCESS_MESSAGE');

                          // hide loading
                          loading.close();

                          // reload data
                          this.needsRefreshList(true);
                        });
                    });
                  }
                },
                visible: (item: ContactOfContactModel): boolean => {
                  return !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    ContactOfContactModel.canDelete(this.authUser);
                }
              },

              // Divider
              {
                visible: (item: ContactOfContactModel): boolean => {
                  // visible only if at least one of the first two items is visible
                  return !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    ContactOfContactModel.canDelete(this.authUser);
                }
              },

              // See Contact of contact exposures
              {
                label: 'LNG_PAGE_ACTION_SEE_EXPOSURES_TO',
                action: {
                  link: (item: ContactOfContactModel): string[] => {
                    return ['/relationships', EntityType.CONTACT_OF_CONTACT, item.id, 'exposures'];
                  }
                },
                visible: (item: ContactOfContactModel): boolean => {
                  return !item.deleted &&
                    RelationshipModel.canList(this.authUser) &&
                    ContactOfContactModel.canListRelationshipExposures(this.authUser);
                }
              },

              // Divider
              {
                visible: (item: ContactOfContactModel): boolean => {
                  // visible only if at least one of the previous two items is visible
                  return !item.deleted &&
                    RelationshipModel.canList(this.authUser) &&
                    (
                      ContactOfContactModel.canListRelationshipContacts() ||
                      ContactOfContactModel.canListRelationshipExposures(this.authUser)
                    );
                }
              },

              // See records detected by the system as duplicates but they were marked as not duplicates
              {
                label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_SEE_RECORDS_NOT_DUPLICATES',
                action: {
                  link: (item: ContactOfContactModel): string[] => {
                    return ['/duplicated-records/contacts-of-contacts', item.id, 'marked-not-duplicates'];
                  }
                },
                visible: (item: ContactOfContactModel): boolean => {
                  return !item.deleted;
                }
              },

              // View Contact of contact movement map
              {
                label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_VIEW_MOVEMENT',
                action: {
                  link: (item: ContactOfContactModel): string[] => {
                    return ['/contacts-of-contacts', item.id, 'movement'];
                  }
                },
                visible: (item: ContactOfContactModel): boolean => {
                  return !item.deleted &&
                  ContactOfContactModel.canViewMovementMap(this.authUser);
                }
              },

              // View Contact of contact chronology timeline
              {
                label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_VIEW_CHRONOLOGY',
                action: {
                  link: (item: ContactOfContactModel): string[] => {
                    return ['/contacts-of-contacts', item.id, 'chronology'];
                  }
                },
                visible: (item: ContactOfContactModel): boolean => {
                  return !item.deleted &&
                  ContactOfContactModel.canViewChronologyChart(this.authUser);
                }
              },

              // Restore a deleted Contact of contact
              {
                label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_RESTORE_CONTACT_OF_CONTACTS',
                cssClasses: 'gd-list-table-actions-action-menu-warning',
                action: {
                  click: (item: ContactOfContactModel) => {
                    // show confirm dialog to confirm the action
                    this.dialogV2Service.showConfirmDialog({
                      config: {
                        title: {
                          get: () => 'LNG_COMMON_LABEL_RESTORE',
                          data: () => item as any
                        },
                        message: {
                          get: () => 'LNG_DIALOG_CONFIRM_RESTORE_CONTACT_OF_CONTACT',
                          data: () => item as any
                        }
                      }
                    }).subscribe((response) => {
                      // canceled ?
                      if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                        // finished
                        return;
                      }

                      // show loading
                      const loading = this.dialogV2Service.showLoadingDialog();

                      // convert
                      this.contactsOfContactsDataService
                        .restoreContactOfContact(
                          this.selectedOutbreak.id,
                          item.id
                        )
                        .pipe(
                          catchError((err) => {
                            // show error
                            this.toastV2Service.error(err);

                            // hide loading
                            loading.close();

                            // send error down the road
                            return throwError(err);
                          })
                        )
                        .subscribe(() => {
                          // success
                          this.toastV2Service.success('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_RESTORE_SUCCESS_MESSAGE');

                          // hide loading
                          loading.close();

                          // reload data
                          this.needsRefreshList(true);
                        });
                    });
                  }
                },
                visible: (item: ContactOfContactModel): boolean => {
                  return item.deleted &&
                    this.selectedOutbreakIsActive &&
                    ContactOfContactModel.canRestore(this.authUser);
                }
              }
            ]
          }
        ]
      }
    ];
  }

  /**
   * Initialize advanced filters
   */
  protected initializeTableAdvancedFilters(): void {
    this.advancedFilters = [
      // Contact of contact
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'firstName',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'lastName',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'occupation',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION',
        options: (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_AGE,
        field: 'age',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfReporting',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dob',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_BIRTH',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'visualId',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.ADDRESS,
        field: 'addresses',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESS_LOCATION',
        isArray: true
      },
      {
        type: V2AdvancedFilterType.ADDRESS_PHONE_NUMBER,
        field: 'addresses',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PHONE_NUMBER',
        isArray: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfLastContact',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'numberOfExposures',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
        sortable: true
      }
    ];

    // allowed to filter by responsible user ?
    if (UserModel.canList(this.authUser)) {
      this.advancedFilters.push({
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'responsibleUserId',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID',
        options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
      });
    }

  }

  /**
   * Initialize quick actions
   */
  protected initializeQuickActions(): void {
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_COMMON_BUTTON_QUICK_ACTIONS',
      visible: (): boolean => {
        return !this.appliedListFilter;
      },
      menuOptions: [
        // Export contacts of contact
        {
          label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_BUTTON',
          action: {
            click: () => {
              this.exportContactsOfContacts(this.queryBuilder);
            }
          },
          visible: (): boolean => {
            return ContactOfContactModel.canExport(this.authUser);
          }
        },

        // Import contacts of contact
        {
          label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_IMPORT_BUTTON',
          action: {
            link: () => ['/import-export-data', 'contact-of-contact-data', 'import']
          },
          visible: (): boolean => {
            return this.selectedOutbreakIsActive &&
              ContactOfContactModel.canImport(this.authUser);
          }
        },

        // Divider
        {
          visible: (): boolean => {
            return ContactOfContactModel.canExport(this.authUser) ||
            ContactOfContactModel.canImport(this.authUser);
          }
        },

        // Export relationships
        {
          label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_EXPORT_CONTACTS_OF_CONTACTS_RELATIONSHIPS',
          action: {
            click: () => {
              // construct filter by Contact of contact query builder
              const qb = new RequestQueryBuilder();

              // retrieve only relationships that have at least one persons as desired type
              qb.filter.byEquality(
                'persons.type',
                EntityType.CONTACT_OF_CONTACT
              );

              // merge out query builder
              const personsQb = qb.addChildQueryBuilder('person');
              personsQb.merge(this.queryBuilder);

              // remove pagination
              personsQb.paginator.clear();

              // attach condition only if not empty
              if (!personsQb.filter.isEmpty()) {
                // filter only Contacts of contacts
                personsQb.filter.byEquality(
                  'type',
                  EntityType.CONTACT_OF_CONTACT
                );
              }

              // export Contact of contact relationships
              this.exportContactsOfContactsRelationships(qb);
            }
          },
          visible: (): boolean => {
            return ContactOfContactModel.canExportRelationships(this.authUser);
          }
        },

        // Import relationships
        {
          label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_IMPORT_CONTACTS_OF_CONTACTS_RELATIONSHIPS',
          action: {
            link: () => ['/import-export-data', 'relationships', 'import'],
            linkQueryParams: (): Params => {
              return {
                from: Constants.APP_PAGE.CONTACTS_OF_CONTACTS.value
              };
            }
          },
          visible: (): boolean => {
            return OutbreakModel.canImportRelationship(this.authUser) &&
              this.selectedOutbreakIsActive;
          }
        }
      ]
    };
  }

  /**
   * Initialize group actions
   */
  protected initializeGroupActions(): void {
    this.groupActions = [
      {
        label:
          'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_GROUP_ACTION_EXPORT_SELECTED_CONTACTS_OF_CONTACTS',
        action: {
          click: (selected: string[]) => {
            // construct query builder
            const qb = new RequestQueryBuilder();
            qb.filter.bySelect('id', selected, true, null);

            // export
            this.exportContactsOfContacts(qb);
          }
        },
        visible: (): boolean => {
          return ContactOfContactModel.canExport(this.authUser);
        },
        disable: (selected: string[]): boolean => {
          return selected.length < 1;
        }
      },
      {
        label:
          'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_GROUP_ACTION_EXPORT_SELECTED_CONTACTS_OF_CONTACTS_DOSSIER',
        action: {
          click: (selected: string[]) => {
            // remove id from list
            const anonymizeFields =
              this.contactsOfContactsAnonymizeFields.filter((item) => {
                return item.value !== 'id';
              });

            // export dossier
            this.dialogV2Service.showExportData({
              title: {
                get: () =>
                  'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_GROUP_ACTION_EXPORT_SELECTED_CONTACTS_OF_CONTACTS_DOSSIER_DIALOG_TITLE'
              },
              export: {
                url: `outbreaks/${this.selectedOutbreak.id}/contacts-of-contacts/dossier`,
                async: false,
                method: ExportDataMethod.POST,
                fileName: `${this.i18nService.instant(
                  'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE'
                )} - ${moment().format('YYYY-MM-DD HH:mm')}`,
                extraFormData: {
                  append: {
                    contactsOfContacts: selected
                  }
                },
                allow: {
                  types: [ExportDataExtension.ZIP],
                  anonymize: {
                    fields: anonymizeFields,
                    key: 'data'
                  }
                }
              }
            });
          }
        },
        visible: (): boolean => {
          return ContactOfContactModel.canExportDossier(this.authUser);
        },
        disable: (selected: string[]): boolean => {
          return selected.length < 1;
        }
      },
      {
        label:
          'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_GROUP_ACTION_EXPORT_SELECTED_CONTACTS_OF_CONTACTS_RELATIONSHIPS',
        action: {
          click: (selected: string[]) => {
            // construct query builder
            const qb = new RequestQueryBuilder();
            const personsQb = qb.addChildQueryBuilder('person');

            // retrieve only relationships that have at least one persons as desired type
            qb.filter.byEquality('persons.type', EntityType.CONTACT_OF_CONTACT);

            // id
            personsQb.filter.bySelect('id', selected, true, null);

            // type
            personsQb.filter.byEquality('type', EntityType.CONTACT_OF_CONTACT);

            // export Contact of contact relationships
            this.exportContactsOfContactsRelationships(qb);
          }
        },
        visible: (): boolean => {
          return ContactOfContactModel.canExportRelationships(this.authUser);
        },
        disable: (selected: string[]): boolean => {
          return selected.length < 1;
        }
      },
      {
        label:
          'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_GROUP_ACTION_MODIFY_CONTACTS_OF_CONTACTS',
        action: {
          link: (): string[] => {
            return ['/contacts-of-contacts', 'modify-bulk'];
          },
          linkQueryParams: (selected: string[]): Params => {
            return {
              contactOfContactIds: JSON.stringify(selected)
            };
          }
        },
        visible: (): boolean => {
          return ContactOfContactModel.canBulkModify(this.authUser);
        },
        disable: (selected: string[]): boolean => {
          return selected.length < 1;
        }
      }
    ];
  }

  /**
   * Initialize add action
   */
  protected initializeAddAction(): void {}

  /**
   * Initialize grouped data
   */
  protected initializeGroupedData(): void {
    this.groupedData = {
      label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_SHOW_GROUP_BY_RISK_PILLS',
      click: (
        item,
        group
      ) => {
        // no need to refresh group
        group.data.blockNextGet = true;

        // remove previous conditions
        this.queryBuilder.filter.removePathCondition('riskLevel');
        this.queryBuilder.filter.removePathCondition('or.riskLevel');

        // filter by group data
        if (!item) {
          this.filterByEquality(
            'riskLevel',
            null
          );
        } else if (item.label === 'LNG_REFERENCE_DATA_CATEGORY_RISK_LEVEL_UNCLASSIFIED') {
          // clear
          this.filterByNotHavingValue('riskLevel');
        } else {
          // search
          this.filterByEquality(
            'riskLevel',
            item.label
          );
        }
      },
      data: {
        loading: false,
        values: [],
        get: (
          gData: IV2GroupedData,
          refreshUI: () => void
        ) => {
          // loading data
          gData.data.loading = true;

          // clone queryBuilder to clear it
          const clonedQueryBuilder = _.cloneDeep(this.queryBuilder);
          clonedQueryBuilder.paginator.clear();
          clonedQueryBuilder.sort.clear();
          clonedQueryBuilder.clearFields();

          // remove any riskLevel filters so we see all options
          clonedQueryBuilder.filter.remove('riskLevel');

          // load data
          return this.contactsOfContactsDataService
            .getContactsOfContactsGroupedByRiskLevel(
              this.selectedOutbreak.id,
              clonedQueryBuilder
            )
            .pipe(
              // should be the last pipe
              takeUntil(this.destroyed$)
            )
            .subscribe((countResponse) => {
              // group data
              const risk = this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>;

              let values: {
                label: string,
                value: number,
                color?: string,
                order?: any
              }[] = [];
              Object.keys(countResponse.riskLevels || {}).forEach((riskId) => {
                values.push({
                  label: riskId,
                  value: countResponse.riskLevels[riskId].count,
                  color: risk.map[riskId] ? risk.map[riskId].getColorCode() : Constants.DEFAULT_COLOR_REF_DATA,
                  order: risk.map[riskId]?.order !== undefined ?
                    risk.map[riskId].order :
                    Number.MAX_SAFE_INTEGER
                });
              });

              // sort values either by order or label natural order
              values = values.sort((item1, item2) => {
                // if same order, compare labels
                if (item1.order === item2.order) {
                  return this.i18nService.instant(item1.label).localeCompare(this.i18nService.instant(item2.label));
                }

                // format order
                let order1: number = Number.MAX_SAFE_INTEGER;
                try { order1 = parseInt(item1.order, 10); } catch (e) {}
                let order2: number = Number.MAX_SAFE_INTEGER;
                try { order2 = parseInt(item2.order, 10); } catch (e) {}

                // compare order
                return order1 - order2;
              });

              // set data
              gData.data.values = values.map((item) => {
                return {
                  label: item.label,
                  bgColor: item.color,
                  textColor: Constants.hexColorToTextColor(item.color),
                  value: item.value.toLocaleString('en')
                };
              });

              // finished loading data
              gData.data.loading = false;

              // refresh ui
              refreshUI();
            });
        }
      }
    };
  }

  /**
   * Export contacts of contacts data
   */
  private exportContactsOfContacts(qb: RequestQueryBuilder): void {
    this.dialogV2Service.showExportDataAfterLoadingData({
      title: {
        get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_TITLE'
      },
      load: (finished) => {
        // retrieve the list of export fields groups for model
        this.outbreakDataService
          .getExportFieldsGroups(ExportFieldsGroupModelNameEnum.CONTACT_OF_CONTACT)
          .pipe(
            // handle errors
            catchError((err) => {
              // show error
              this.toastV2Service.error(err);

              // send error further
              return throwError(err);
            }),

            // should be the last pipe
            takeUntil(this.destroyed$)
          )
          .subscribe((fieldsGroupList) => {
            // set groups
            const contactsOfContactsFieldGroups: ILabelValuePairModel[] = fieldsGroupList.options.map((item) => ({
              label: item.name,
              value: item.name
            }));

            // group restrictions
            const contactsOfContactsFieldGroupsRequires: IV2ExportDataConfigGroupsRequired = fieldsGroupList.toRequiredList();

            // show export
            finished({
              title: {
                get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_TITLE'
              },
              export: {
                url: `/outbreaks/${this.selectedOutbreak.id}/contacts-of-contacts/export`,
                async: true,
                method: ExportDataMethod.POST,
                fileName: `${this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE')} - ${moment().format('YYYY-MM-DD HH:mm')}`,
                queryBuilder: qb,
                allow: {
                  types: [
                    ExportDataExtension.CSV,
                    ExportDataExtension.XLS,
                    ExportDataExtension.XLSX,
                    ExportDataExtension.JSON,
                    ExportDataExtension.ODS,
                    ExportDataExtension.PDF
                  ],
                  encrypt: true,
                  anonymize: {
                    fields: this.contactsOfContactsAnonymizeFields
                  },
                  groups: {
                    fields: contactsOfContactsFieldGroups,
                    required: contactsOfContactsFieldGroupsRequires
                  },
                  dbColumns: true,
                  dbValues: true,
                  jsonReplaceUndefinedWithNull: true
                }
              }
            });
          });
      }
    });
  }

  /**
   * Export contacts of contacts relationships
   */
  private exportContactsOfContactsRelationships(qb: RequestQueryBuilder): void {
    this.dialogV2Service
      .showExportDataAfterLoadingData({
        title: {
          get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_RELATIONSHIPS_TITLE'
        },
        load: (finished) => {
          // retrieve the list of export fields groups for model
          this.outbreakDataService
            .getExportFieldsGroups(ExportFieldsGroupModelNameEnum.RELATIONSHIP)
            .pipe(
              // handle errors
              catchError((err) => {
                // show error
                this.toastV2Service.error(err);

                // send error further
                return throwError(err);
              }),

              // should be the last pipe
              takeUntil(this.destroyed$)
            )
            .subscribe((fieldsGroupList) => {
              // set groups
              const relationshipFieldGroups: ILabelValuePairModel[] = fieldsGroupList.options.map((item) => ({
                label: item.name,
                value: item.name
              }));

              // group restrictions
              const relationshipFieldGroupsRequires: IV2ExportDataConfigGroupsRequired = fieldsGroupList.toRequiredList();

              // show export
              finished({
                title: {
                  get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_RELATIONSHIPS_TITLE'
                },
                export: {
                  url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
                  async: true,
                  method: ExportDataMethod.POST,
                  fileName: `${this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_RELATIONSHIP_FILE_NAME')} - ${moment().format('YYYY-MM-DD')}`,
                  queryBuilder: qb,
                  allow: {
                    types: [
                      ExportDataExtension.CSV,
                      ExportDataExtension.XLS,
                      ExportDataExtension.XLSX,
                      ExportDataExtension.JSON,
                      ExportDataExtension.ODS,
                      ExportDataExtension.PDF
                    ],
                    encrypt: true,
                    anonymize: {
                      fields: this.relationshipAnonymizeFields
                    },
                    groups: {
                      fields: relationshipFieldGroups,
                      required: relationshipFieldGroupsRequires
                    },
                    dbColumns: true,
                    dbValues: true,
                    jsonReplaceUndefinedWithNull: true
                  }
                }
              });
            });
        }
      });
  }

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs(): void {
    // set breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/version']
        }
      }, {
        label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE',
        action: null
      }
    ];
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [
      'id',
      'lastName',
      'middleName',
      'firstName',
      'visualId',
      'addresses',
      'age',
      'gender',
      'riskLevel',
      'dateOfLastContact',
      'responsibleUserId',
      'numberOfExposures',
      'deleted',
      'createdBy',
      'createdAt',
      'updatedBy',
      'updatedAt'
    ];
  }

  /**
   * Re(load) the Contacts list
   */
  refreshList(
    triggeredByPageChange: boolean
  ) {
    if (this.selectedOutbreak) {
      // retrieve created user & modified user information
      this.queryBuilder.include('createdByUser', true);
      this.queryBuilder.include('updatedByUser', true);

      // retrieve responsible user information
      this.queryBuilder.include('responsibleUser', true);

      // refresh badges list with applied filter
      if (!triggeredByPageChange) {
        this.initializeGroupedData();
      }

      // retrieve the list of Contacts
      this.contactsOfContactsList$ = this.contactsOfContactsDataService
        .getContactsOfContactsList(this.selectedOutbreak.id, this.queryBuilder)
        .pipe(
          switchMap((data) => {
            // determine locations that we need to retrieve
            const locationsIdsMap: {
              [locationId: string]: true
            } = {};
            data.forEach((item) => {
              (item.addresses || []).forEach((address) => {
                // nothing to add ?
                if (!address?.locationId) {
                  return;
                }

                // add location to list
                locationsIdsMap[address.locationId] = true;
              });
            });

            // determine ids
            const locationIds: string[] = Object.keys(locationsIdsMap);

            // nothing to retrieve ?
            if (locationIds.length < 1) {
              return of(data);
            }

            // construct location query builder
            const qb = new RequestQueryBuilder();
            qb.filter.bySelect(
              'id',
              locationIds,
              false,
              null
            );

            // retrieve locations
            return this.locationDataService
              .getLocationsList(qb)
              .pipe(
                map((locations) => {
                  // map locations
                  const locationsMap: {
                    [locationId: string]: LocationModel
                  } = {};
                  locations.forEach((location) => {
                    locationsMap[location.id] = location;
                  });

                  // set locations
                  data.forEach((item) => {
                    (item.addresses || []).forEach((address) => {
                      address.location = address.locationId && locationsMap[address.locationId] ?
                        locationsMap[address.locationId] :
                        address.location;
                    });
                  });

                  // finished
                  return data;
                })
              );
          })
        )
        .pipe(

          // should be the last pipe
          takeUntil(this.destroyed$)
        );
    }
  }

  /**
     * Get total number of items, based on the applied filters
     */
  refreshListCount(applyHasMoreLimit?: boolean) {
    if (!this.selectedOutbreak) {
      return;
    }

    // reset
    this.pageCount = undefined;

    // set apply value
    if (applyHasMoreLimit !== undefined) {
      this.applyHasMoreLimit = applyHasMoreLimit;
    }

    // remove paginator from query builder
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();

    // apply has more limit
    if (this.applyHasMoreLimit) {
      countQueryBuilder.flag(
        'applyHasMoreLimit',
        true
      );
    }

    // count
    this.contactsOfContactsDataService.getContactsOfContactsCount(this.selectedOutbreak.id, countQueryBuilder).pipe(
      // error
      catchError((err) => {
        this.toastV2Service.error(err);
        return throwError(err);
      }),

      // should be the last pipe
      takeUntil(this.destroyed$)
    ).subscribe((response) => {
      this.pageCount = response;
    });
  }
}
