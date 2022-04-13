import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import * as _ from 'lodash';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { moment } from '../../../../core/helperClasses/x-moment';
import { AddressModel } from '../../../../core/models/address.model';
import { CaseModel } from '../../../../core/models/case.model';
import { Constants } from '../../../../core/models/constants';
import { ContactModel } from '../../../../core/models/contact.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { EntityType } from '../../../../core/models/entity-type';
import { ExportFieldsGroupModelNameEnum } from '../../../../core/models/export-fields-group.model';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { LocationModel } from '../../../../core/models/location.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { TeamModel } from '../../../../core/models/team.model';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
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
import { IV2SideDialogConfigButtonType, IV2SideDialogConfigInputSingleDropdown, IV2SideDialogConfigInputText, V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';

@Component({
  selector: 'app-contacts-list',
  templateUrl: './contacts-list.component.html'
})
export class ContactsListComponent
  extends ListComponent
  implements OnDestroy
{
  // list of existing contacts
  contactsList$: Observable<ContactModel[]>;

  // constants
  UserSettings = UserSettings;
  Constants = Constants;

  // anonymize fields
  anonymizeFields: LabelValuePair[] = [
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_ID', 'id'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_FIRST_NAME', 'firstName'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_MIDDLE_NAME', 'middleName'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_LAST_NAME', 'lastName'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_GENDER', 'gender'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_PHONE_NUMBER', 'phoneNumber'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_OCCUPATION', 'occupation'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_DATE_OF_BIRTH', 'dob'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_AGE', 'age'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_DOCUMENTS', 'documents'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_ADDRESSES', 'addresses'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_RISK_LEVEL', 'riskLevel'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_RISK_REASON', 'riskReason'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_TYPE', 'type'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING', 'dateOfReporting'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE', 'isDateOfReportingApproximate'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', 'createdAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', 'createdBy'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', 'updatedAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', 'updatedBy'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_DELETED', 'deleted'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', 'deletedAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', 'createdOn'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_VISUAL_ID', 'visualId'),
    new LabelValuePair('LNG_CASE_FIELD_LABEL_CLASSIFICATION', 'classification'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_WAS_CASE', 'wasCase'),
    new LabelValuePair('LNG_CASE_FIELD_LABEL_WAS_CONTACT', 'wasContact'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_DATE_BECOME_CONTACT', 'dateBecomeContact'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_OUTCOME_ID', 'outcomeId'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_DATE_OF_OUTCOME', 'dateOfOutcome'),
    new LabelValuePair('LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED', 'transferRefused'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_SAFE_BURIAL', 'safeBurial'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_DATE_OF_BURIAL', 'dateOfBurial'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_FOLLOW_UP', 'followUp'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT', 'dateOfLastContact'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_NUMBER_OF_EXPOSURES', 'numberOfExposures'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_NUMBER_OF_CONTACTS', 'numberOfContacts'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_VACCINES_RECEIVED', 'vaccinesReceived'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_PREGNANCY_STATUS', 'pregnancyStatus'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_RELATIONSHIP', 'relationship'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_TEAM_ID', 'followUpTeamId'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID', 'responsibleUserId'),
    new LabelValuePair('LNG_CONTACT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS', 'questionnaireAnswers')
  ];

  // relationship anonymize fields
  relationshipAnonymizeFields: LabelValuePair[] = [
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
    private activatedRoute: ActivatedRoute,
    private contactDataService: ContactDataService,
    private locationDataService: LocationDataService,
    private toastV2Service: ToastV2Service,
    private outbreakDataService: OutbreakDataService,
    private dialogV2Service: DialogV2Service,
    private genericDataService: GenericDataService,
    private i18nService: I18nService,
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
   * Initialize Table Columns
   */
  protected initializeTableColumns() {
    // address model used to search by phone number, address line, postal code, city....
    const filterAddressModel: AddressModel = new AddressModel({
      geoLocationAccurate: ''
    });

    // default table columns
    this.tableColumns = [
      {
        field: 'lastName',
        label: 'LNG_CONTACT_FIELD_LABEL_LAST_NAME',
        pinned: IV2ColumnPinned.LEFT,
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
        label: 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'visualId',
        label: 'LNG_CONTACT_FIELD_LABEL_VISUAL_ID',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'location',
        label: 'LNG_CONTACT_FIELD_LABEL_ADDRESS_LOCATION',
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
          return data.mainAddress?.location?.name ?
            `/locations/${ data.mainAddress.location.id }/view` :
            undefined;
        }
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
        field: 'addresses.addressLine1',
        label: 'LNG_CONTACT_FIELD_LABEL_ADDRESS',
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
        },
        sortable: true
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
        label: 'LNG_ADDRESS_FIELD_LABEL_MANUAL_COORDINATES',
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
          options: (this.activatedRoute.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options,
          defaultValue: ''
        },
        sortable: true
      },
      {
        field: 'age',
        label: 'LNG_CONTACT_FIELD_LABEL_AGE',
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
        label: 'LNG_CONTACT_FIELD_LABEL_GENDER',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'phoneNumber',
        label: 'LNG_CONTACT_FIELD_LABEL_PHONE_NUMBER',
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
        label: 'LNG_CONTACT_FIELD_LABEL_RISK_LEVEL',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          includeNoValue: true
        }
      },
      {
        field: 'dateOfLastContact',
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATE
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true
      },
      {
        field: 'followUpTeamId',
        label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_TEAM_ID',
        notVisible: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: []
        },
        exclude: (): boolean => {
          return !TeamModel.canList(this.authUser);
        },
        link: (data) => {
          return data.followUpTeamId ?
            `/teams/${data.followUpTeamId}/view` :
            undefined;
        }
      },
      {
        field: 'followUp.endDate',
        label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_END_DATE',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATE
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true
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
            title: 'LNG_CONTACT_FIELD_LABEL_RISK_LEVEL',
            items: (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).list.map((item) => {
              return {
                form: {
                  type: IV2ColumnStatusFormType.TRIANGLE,
                  color: item.getColorCode()
                },
                label: item.id
              };
            })
          },

          // alerted
          {
            title: 'LNG_COMMON_LABEL_STATUSES_ALERTED',
            items: [{
              form: {
                type: IV2ColumnStatusFormType.STAR,
                color: 'var(--gd-danger)'
              },
              label: ' '
            }]
          },

          // followed
          {
            title: 'LNG_PAGE_LIST_CONTACTS_LABEL_STATUS_TITLE',
            items: [{
              form: {
                type: IV2ColumnStatusFormType.SQUARE,
                color: 'var(--gd-followed-status)'
              },
              label: 'LNG_PAGE_LIST_CONTACTS_LABEL_STATUS_FOLLOWED_UP'
            },
            {
              form: {
                type: IV2ColumnStatusFormType.SQUARE,
                color: 'var(--gd-not-followed-status)'
              },
              label: 'LNG_PAGE_LIST_CONTACTS_LABEL_STATUS_NOT_FOLLOWED_UP'
            }]
          }
        ],
        forms: (_column, data: ContactModel): V2ColumnStatusForm[] => {
          // construct list of forms that we need to display
          const forms: V2ColumnStatusForm[] = [];

          // risk
          const risk = this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>;
          if (
            data.riskLevel &&
            risk.map[data.riskLevel]
          ) {
            forms.push({
              type: IV2ColumnStatusFormType.TRIANGLE,
              color: risk.map[data.riskLevel].getColorCode(),
              tooltip: this.i18nService.instant(data.riskLevel)
            });
          }

          // alerted
          if (data.alerted) {
            forms.push({
              type: IV2ColumnStatusFormType.STAR,
              color: 'var(--gd-danger)',
              tooltip: this.i18nService.instant('LNG_COMMON_LABEL_STATUSES_ALERTED')
            });
          }

          // follow up
          if (data.followUp && data.followUp.startDate && data.followUp.endDate && moment().isBetween(data.dateOfLastContact, data.followUp.endDate, undefined, '[]') ) {
            forms.push({
              type: IV2ColumnStatusFormType.SQUARE,
              color: 'var(--gd-followed-status)',
              tooltip: this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_LABEL_STATUS_FOLLOWED_UP')
            });
          }
          else {
            forms.push({
              type: IV2ColumnStatusFormType.SQUARE,
              color: 'var(--gd-not-followed-status)',
              tooltip: this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_LABEL_STATUS_NOT_FOLLOWED_UP')
            });
          }

          // finished
          return forms;
        }
      },
      {
        field: 'followUp.status',
        label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.followUp as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'wasCase',
        label: 'LNG_CONTACT_FIELD_LABEL_WAS_CASE',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        },
        filter: {
          type: V2FilterType.BOOLEAN,
          value: '',
          defaultValue: ''
        },
        sortable: true
      },
      {
        field: 'responsibleUserId',
        label: 'LNG_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID',
        notVisible: true,
        format: {
          type: 'responsibleUser.name'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canList(this.authUser);
        },
        link: (data) => {
          return data.responsibleUserId ?
            `/users/${ data.responsibleUserId }/view` :
            undefined;
        }
      },
      {
        field: 'numberOfContacts',
        label: 'LNG_CONTACT_FIELD_LABEL_NUMBER_OF_CONTACTS',
        format: {
          type: V2ColumnFormat.BUTTON
        },
        filter: {
          type: V2FilterType.NUMBER_RANGE,
          min: 0
        },
        sortable: true,
        notVisible: true,
        cssCellClass: 'gd-cell-button',
        buttonLabel: (item) => (item.numberOfContacts || '').toLocaleString('en'),
        color: 'text',
        click: (item) => {
          // if we do not have contacts return
          if (item.numberOfContacts < 1) {
            return;
          }

          // display dialog
          this.entityHelperService.contacts(this.selectedOutbreak, item);
        },
        disabled: (data) =>
          !RelationshipModel.canList(this.authUser) ||
          !data.canListRelationshipContacts(this.authUser)
      },
      {
        field: 'numberOfExposures',
        label: 'LNG_CONTACT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
        format: {
          type: V2ColumnFormat.BUTTON
        },
        filter: {
          type: V2FilterType.NUMBER_RANGE,
          min: 0
        },
        sortable: true,
        notVisible: true,
        cssCellClass: 'gd-cell-button',
        buttonLabel: (item) => (item.numberOfExposures || '').toLocaleString('en'),
        color: 'text',
        click: (item) => {
          // if we do not have exposures return
          if (item.numberOfExposures < 1) {
            return;
          }

          // display dialog
          this.entityHelperService.exposures(this.selectedOutbreak, item);
        },
        disabled: (data) =>
          !RelationshipModel.canList(this.authUser) ||
          !data.canListRelationshipExposures(this.authUser)
      },
      {
        field: 'deleted',
        label: 'LNG_CONTACT_FIELD_LABEL_DELETED',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        },
        filter: {
          type: V2FilterType.DELETED,
          value: false,
          defaultValue: false
        },
        sortable: true
      },
      {
        field: 'createdBy',
        label: 'LNG_CONTACT_FIELD_LABEL_CREATED_BY',
        notVisible: true,
        format: {
          type: 'createdByUser.name'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
        },
        link: (data) => {
          return data.createdBy ? `/users/${data.createdBy}/view` : undefined;
        }
      },
      {
        field: 'createdAt',
        label: 'LNG_CONTACT_FIELD_LABEL_CREATED_AT',
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
        label: 'LNG_CONTACT_FIELD_LABEL_UPDATED_BY',
        notVisible: true,
        format: {
          type: 'updatedByUser.name'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
        },
        link: (data) => {
          return data.updatedBy ? `/users/${data.updatedBy}/view` : undefined;
        }
      },
      {
        field: 'updatedAt',
        label: 'LNG_CONTACT_FIELD_LABEL_UPDATED_AT',
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
          // View Contact
          {
            type: V2ActionType.ICON,
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_CONTACTS_ACTION_VIEW_CONTACT',
            action: {
              link: (data: ContactModel): string[] => {
                return ['/contacts', data.id, 'view'];
              }
            },
            visible: (item: ContactModel): boolean => {
              return !item.deleted && ContactModel.canView(this.authUser);
            }
          },

          // Modify Contact
          {
            type: V2ActionType.ICON,
            icon: 'edit',
            iconTooltip: 'LNG_PAGE_LIST_CONTACTS_ACTION_MODIFY_CONTACT',
            action: {
              link: (item: ContactModel): string[] => {
                return ['/contacts', item.id, 'modify'];
              }
            },
            visible: (item: ContactModel): boolean => {
              return (
                !item.deleted &&
                this.selectedOutbreakIsActive &&
                ContactModel.canModify(this.authUser)
              );
            }
          },

          // Other actions
          {
            type: V2ActionType.MENU,
            icon: 'more_horiz',
            menuOptions: [
              // Delete Contact
              {
                label: 'LNG_PAGE_LIST_CONTACTS_ACTION_DELETE_CONTACT',
                cssClasses: 'gd-list-table-actions-action-menu-warning',
                action: {
                  click: (item: ContactModel): void => {
                    // determine what we need to delete
                    this.dialogV2Service
                      .showConfirmDialog({
                        config: {
                          title: {
                            get: () => 'LNG_COMMON_LABEL_DELETE',
                            data: () => ({ name: item.name })
                          },
                          message: {
                            get: () => 'LNG_DIALOG_CONFIRM_DELETE_CONTACT',
                            data: () => ({ name: item.name })
                          }
                        }
                      })
                      .subscribe((response) => {
                        // canceled ?
                        if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                          // finished
                          return;
                        }

                        // show loading
                        const loading = this.dialogV2Service.showLoadingDialog();

                        // delete contact
                        this.contactDataService
                          .deleteContact(this.selectedOutbreak.id, item.id)
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
                            this.toastV2Service.success('LNG_PAGE_LIST_CONTACTS_ACTION_DELETE_SUCCESS_MESSAGE');

                            // hide loading
                            loading.close();

                            // reload data
                            this.needsRefreshList(true);
                          });
                      });
                  }
                },
                visible: (item: ContactModel): boolean => {
                  return !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    ContactModel.canDelete(this.authUser);
                }
              },

              // Divider
              {
                visible: (item: ContactModel): boolean => {
                  // visible only if at least one of the first two items is visible
                  return !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    ContactModel.canDelete(this.authUser);
                }
              },

              // Convert Contact to Contact
              {
                label: 'LNG_PAGE_LIST_CONTACTS_ACTION_CONVERT_TO_CASE',
                cssClasses: 'gd-list-table-actions-action-menu-warning',
                action: {
                  click: (item: ContactModel): void => {
                    // show confirm dialog to confirm the action
                    this.dialogV2Service
                      .showConfirmDialog({
                        config: {
                          title: {
                            get: () => 'LNG_COMMON_LABEL_CONVERT',
                            data: () => ({
                              name: item.name,
                              type: this.i18nService.instant(EntityType.CASE)
                            })
                          },
                          message: {
                            get: () => 'LNG_DIALOG_CONFIRM_CONVERT_CONTACT_TO_CASE',
                            data: () => item as any
                          }
                        }
                      })
                      .subscribe((response) => {
                        // canceled ?
                        if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                          // finished
                          return;
                        }

                        // show loading
                        const loading = this.dialogV2Service.showLoadingDialog();

                        // convert
                        this.contactDataService
                          .convertContactToCase(this.selectedOutbreak.id, item.id)
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
                            this.toastV2Service.success('LNG_PAGE_LIST_CONTACTS_ACTION_CONVERT_CONTACT_TO_CASE_SUCCESS_MESSAGE');

                            // hide loading
                            loading.close();

                            // reload data
                            this.needsRefreshList(true);
                          });
                      });
                  }
                },
                visible: (item: ContactModel): boolean => {
                  return !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    ContactModel.canConvertToCase(this.authUser);
                }
              },

              // Divider
              {
                visible: (item: ContactModel): boolean => {
                  // visible only if at least one of the first two items is visible
                  return !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    ContactModel.canConvertToCase(this.authUser);
                }
              },

              // Add Contact of Contact
              {
                label: 'LNG_PAGE_LIST_CONTACTS_ACTION_ADD_CONTACT_OF_CONTACT',
                action: {
                  link: (): string[] => {
                    return ['/contacts-of-contacts', 'create'];
                  },
                  linkQueryParams: (item: ContactModel): Params => {
                    return {
                      entityType: EntityType.CONTACT,
                      entityId: item.id
                    };
                  }
                },
                visible: (item: ContactModel): boolean => {
                  return !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    ContactModel.canCreate(this.authUser) &&
                    ContactModel.canCreateContactOfContact(this.authUser);
                }
              },

              // Bulk add Contacts of Contacts
              {
                label: 'LNG_PAGE_LIST_CONTACTS_ACTION_BULK_ADD_CONTACTS',
                action: {
                  link: (): string[] => {
                    return ['/contacts-of-contacts', 'create-bulk'];
                  },
                  linkQueryParams: (item: ContactModel): Params => {
                    return {
                      entityType: EntityType.CONTACT_OF_CONTACT,
                      entityId: item.id
                    };
                  }
                },
                visible: (item: ContactModel): boolean => {
                  return !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    ContactModel.canBulkCreate(this.authUser) &&
                    ContactModel.canBulkCreateContactOfContact(this.authUser);
                }
              },

              // Divider
              {
                visible: (item: ContactModel): boolean => {
                  // visible only if at least one of the previous two items is visible
                  return !item.deleted &&
                    this.selectedOutbreakIsActive && (
                    (
                      ContactModel.canCreate(this.authUser) &&
                      ContactModel.canCreateContactOfContact(this.authUser)
                    ) || (
                      ContactModel.canBulkCreate(this.authUser) &&
                      ContactModel.canBulkCreateContactOfContact(this.authUser)
                    )
                  );
                }
              },

              // Add Follow-up to Contact
              {
                label: 'LNG_PAGE_LIST_CONTACTS_ACTION_ADD_FOLLOW_UP',
                action: {
                  link: (item: ContactModel): string[] => {
                    return ['/contacts', item.id, 'follow-ups', 'create'];
                  }
                },
                visible: (item: ContactModel): boolean => {
                  return !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    FollowUpModel.canCreate(this.authUser);
                }
              },

              // Divider
              {
                visible: (item: ContactModel): boolean => {
                  // visible only if at least one of the previous two items is visible
                  return !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    FollowUpModel.canCreate(this.authUser);
                }
              },

              // See contact exposures
              {
                label: 'LNG_PAGE_ACTION_SEE_EXPOSURES_TO',
                action: {
                  link: (item: ContactModel): string[] => {
                    return [
                      '/relationships',
                      EntityType.CONTACT,
                      item.id,
                      'exposures'
                    ];
                  }
                },
                visible: (item: ContactModel): boolean => {
                  return !item.deleted &&
                    ContactModel.canListRelationshipExposures(this.authUser);
                }
              },

              // See contact contacts of contacts
              {
                label: 'LNG_PAGE_ACTION_SEE_EXPOSURES_FROM',
                action: {
                  link: (item: ContactModel): string[] => {
                    return ['/relationships', EntityType.CONTACT, item.id, 'contacts'];
                  }
                },
                visible: (item: ContactModel): boolean => {
                  return !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    ContactModel.canListRelationshipContacts(this.authUser);
                }
              },

              // Divider
              {
                visible: (item: ContactModel): boolean => {
                  // visible only if at least one of the previous two items is visible
                  return !item.deleted &&
                    ContactModel.canListRelationshipExposures(this.authUser);
                }
              },

              // See records detected by the system as duplicates but they were marked as not duplicates
              {
                label:
                  'LNG_PAGE_LIST_CONTACTS_ACTION_SEE_RECORDS_NOT_DUPLICATES',
                action: {
                  link: (item: ContactModel): string[] => {
                    return ['/duplicated-records/contacts', item.id, 'marked-not-duplicates'];
                  }
                },
                visible: (item: ContactModel): boolean => {
                  return !item.deleted;
                }
              },

              // See contact lab results
              {
                label: 'LNG_PAGE_LIST_CONTACTS_ACTION_SEE_LAB_RESULTS',
                action: {
                  link: (item: ContactModel): string[] => {
                    return ['/lab-results', 'contacts', item.id];
                  }
                },
                visible: (item: ContactModel): boolean => {
                  return !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    LabResultModel.canList(this.authUser) &&
                    ContactModel.canListLabResult(this.authUser);
                }
              },

              // See contact follow-us
              {
                label: 'LNG_PAGE_LIST_CONTACTS_ACTION_VIEW_FOLLOW_UPS',
                action: {
                  link: (item: ContactModel): string[] => {
                    return ['/contacts', 'contact-related-follow-ups', item.id];
                  }
                },
                visible: (item: ContactModel): boolean => {
                  return !item.deleted && FollowUpModel.canList(this.authUser);
                }
              },

              // See questionnaire
              {
                label: 'LNG_PAGE_MODIFY_CONTACT_TAB_QUESTIONNAIRE_TITLE',
                action: {
                  link: (item: ContactModel): string[] => {
                    return ['/contacts', item.id, 'view-questionnaire'];
                  }
                },
                visible: (item: ContactModel): boolean => {
                  return !item.deleted && ContactModel.canView(this.authUser);
                }
              },

              // Divider
              {
                visible: (item: ContactModel): boolean => {
                  return !item.deleted && FollowUpModel.canList(this.authUser);
                }
              },

              // View Contact movement map
              {
                label: 'LNG_PAGE_LIST_CONTACTS_ACTION_VIEW_MOVEMENT',
                action: {
                  link: (item: ContactModel): string[] => {
                    return ['/contacts', item.id, 'movement'];
                  }
                },
                visible: (item: ContactModel): boolean => {
                  return !item.deleted &&
                    ContactModel.canViewMovementMap(this.authUser);
                }
              },

              // View Contact chronology timeline
              {
                label: 'LNG_PAGE_LIST_CONTACTS_ACTION_VIEW_CHRONOLOGY',
                action: {
                  link: (item: ContactModel): string[] => {
                    return ['/contacts', item.id, 'chronology'];
                  }
                },
                visible: (item: ContactModel): boolean => {
                  return !item.deleted &&
                    ContactModel.canViewChronologyChart(this.authUser);
                }
              },

              // Restore a deleted contact
              {
                label: 'LNG_PAGE_LIST_CONTACTS_ACTION_RESTORE_CONTACT',
                cssClasses: 'gd-list-table-actions-action-menu-warning',
                action: {
                  click: (item: ContactModel) => {
                    // show confirm dialog to confirm the action
                    this.dialogV2Service
                      .showConfirmDialog({
                        config: {
                          title: {
                            get: () => 'LNG_COMMON_LABEL_RESTORE',
                            data: () => item as any
                          },
                          message: {
                            get: () => 'LNG_DIALOG_CONFIRM_RESTORE_CONTACT',
                            data: () => item as any
                          }
                        }
                      })
                      .subscribe((response) => {
                        // canceled ?
                        if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                          // finished
                          return;
                        }

                        // show loading
                        const loading = this.dialogV2Service.showLoadingDialog();

                        // convert
                        this.contactDataService
                          .restoreContact(this.selectedOutbreak.id, item.id)
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
                            this.toastV2Service.success('LNG_PAGE_LIST_CONTACTS_ACTION_RESTORE_SUCCESS_MESSAGE');

                            // hide loading
                            loading.close();

                            // reload data
                            this.needsRefreshList(true);
                          });
                      });
                  }
                },
                visible: (item: ContactModel): boolean => {
                  return item.deleted &&
                    this.selectedOutbreakIsActive &&
                    ContactModel.canRestore(this.authUser);
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
      // Contact
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'firstName',
        label: 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'middleName',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_MIDDLE_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'lastName',
        label: 'LNG_CONTACT_FIELD_LABEL_LAST_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'occupation',
        label: 'LNG_CONTACT_FIELD_LABEL_OCCUPATION',
        options: (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_AGE,
        field: 'age',
        label: 'LNG_CONTACT_FIELD_LABEL_AGE',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfReporting',
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dob',
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_BIRTH',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'visualId',
        label: 'LNG_CONTACT_FIELD_LABEL_VISUAL_ID',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.ADDRESS,
        field: 'addresses',
        label: 'LNG_CONTACT_FIELD_LABEL_ADDRESSES',
        isArray: true
      },
      {
        type: V2AdvancedFilterType.ADDRESS_PHONE_NUMBER,
        field: 'addresses',
        label: 'LNG_CONTACT_FIELD_LABEL_PHONE_NUMBER',
        isArray: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'followUp.status',
        label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS',
        options: (this.activatedRoute.snapshot.data.followUp as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'followUp.endDate',
        label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_END_DATE',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfLastContact',
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS,
        field: 'questionnaireAnswers',
        label: 'LNG_CONTACT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
        template: () => this.selectedOutbreak.contactInvestigationTemplate
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'pregnancyStatus',
        label: 'LNG_CONTACT_FIELD_LABEL_PREGNANCY_STATUS',
        options: (this.activatedRoute.snapshot.data.pregnancy as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'vaccinesReceived.vaccine',
        label: 'LNG_CONTACT_FIELD_LABEL_VACCINE',
        options: (this.activatedRoute.snapshot.data.vaccine as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'vaccinesReceived.status',
        label: 'LNG_CONTACT_FIELD_LABEL_VACCINE_STATUS',
        options: (this.activatedRoute.snapshot.data.vaccineStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'vaccinesReceived.date',
        label: 'LNG_CONTACT_FIELD_LABEL_VACCINE_DATE'
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'wasCase',
        label: 'LNG_CONTACT_FIELD_LABEL_WAS_CASE',
        options: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'numberOfContacts',
        label: 'LNG_CONTACT_FIELD_LABEL_NUMBER_OF_CONTACTS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'numberOfExposures',
        label: 'LNG_CONTACT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
        sortable: true
      }
    ];

    // allowed to filter by follow-up team ?
    if (TeamModel.canList(this.authUser)) {
      this.advancedFilters.push({
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'followUpTeamId',
        label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_TEAM_ID',
        options: (this.activatedRoute.snapshot.data.followUp as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
      });
    }

    // allowed to filter by follow-up user ?
    if (UserModel.canList(this.authUser)) {
      this.advancedFilters.push({
        field: 'responsibleUserId',
        label: 'LNG_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID',
        type: V2AdvancedFilterType.MULTISELECT,
        options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<ILabelValuePairModel>).options
      });
    }

    // Relation - Follow-up
    if (FollowUpModel.canList(this.authUser)) {
      this.advancedFilters.push(
        {
          field: 'date',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_DATE',
          type: V2AdvancedFilterType.RANGE_DATE,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          field: 'index',
          label: 'LNG_CONTACT_FIELD_LABEL_DAY_OF_FOLLOWUP',
          type: V2AdvancedFilterType.RANGE_NUMBER,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          field: 'targeted',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED',
          type: V2AdvancedFilterType.SELECT,
          options: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          field: 'statusId',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
          type: V2AdvancedFilterType.SELECT,
          options: (this.activatedRoute.snapshot.data.dailyFollowUp as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        },
        {
          field: 'questionnaireAnswers',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
          type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS,
          template: () => this.selectedOutbreak.contactFollowUpTemplate,
          relationshipPath: ['followUps'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        }
      );
    }

    // case condition
    const caseCondition = new RequestQueryBuilder();
    caseCondition.filter.byEquality(
      'type',
      EntityType.CASE
    );

    // Relation - Cases
    if (CaseModel.canList(this.authUser)) {
      this.advancedFilters.push(
        {
          field: 'firstName',
          label: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
          type: V2AdvancedFilterType.TEXT,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel:
            'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          field: 'lastName',
          label: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
          type: V2AdvancedFilterType.TEXT,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel:
            'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          field: 'gender',
          label: 'LNG_CASE_FIELD_LABEL_GENDER',
          type: V2AdvancedFilterType.MULTISELECT,
          options: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ILabelValuePairModel>).options,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel:
            'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          field: 'age',
          label: 'LNG_CASE_FIELD_LABEL_AGE',
          type: V2AdvancedFilterType.RANGE_AGE,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel:
            'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        },
        {
          field: 'questionnaireAnswers',
          label: 'LNG_CASE_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
          type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS,
          template: () => this.selectedOutbreak.caseInvestigationTemplate,
          relationshipPath: ['relationships', 'people'],
          relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
          extraConditions: caseCondition
        }
      );
    }
  }

  /**
   * Initialize table quick actions
   */
  protected initializeQuickActions(): void {
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_COMMON_BUTTON_QUICK_ACTIONS',
      visible: (): boolean => {
        return (
          !this.appliedListFilter &&
          (ContactModel.canModify(this.authUser) ||
            ContactModel.canExport(this.authUser) ||
            ContactModel.canImport(this.authUser) ||
            ContactModel.canExportRelationships(this.authUser) ||
            ContactModel.canExportDailyFollowUpList(this.authUser) ||
            ContactModel.canExportDailyFollowUpsForm(this.authUser))
        );
      },
      menuOptions: [
        // Change contact final follow up status
        {
          label:
            'LNG_PAGE_LIST_CONTACTS_ACTION_CHANGE_CONTACT_FINAL_FOLLOW_UP_STATUS',
          action: {
            click: () => {
              this.changeContactFinalFollowUpStatus();
            }
          },
          visible: (): boolean => {
            return ContactModel.canBulkModify(this.authUser);
          }
        },

        // Divider
        {
          visible: (): boolean => {
            return true;
          }
        },

        // Export contacts
        {
          label: 'LNG_PAGE_LIST_CONTACTS_EXPORT_BUTTON',
          action: {
            click: () => {
              this.exportContacts(this.queryBuilder);
            }
          },
          visible: (): boolean => {
            return ContactModel.canExport(this.authUser);
          }
        },
        // Import contacts
        {
          label: 'LNG_PAGE_LIST_CONTACTS_IMPORT_BUTTON',
          action: {
            link: () => ['/import-export-data', 'contact-data', 'import']
          },
          visible: (): boolean => {
            return ContactModel.canImport(this.authUser);
          }
        },

        // Divider
        {
          visible: (): boolean => {
            return (
              ContactModel.canExport(this.authUser) ||
              ContactModel.canImport(this.authUser)
            );
          }
        },

        // Export relationships
        {
          label: 'LNG_PAGE_LIST_CONTACTS_ACTION_EXPORT_CONTACTS_RELATIONSHIPS',
          action: {
            click: () => {
              // construct filter by contact query builder
              const qb = new RequestQueryBuilder();

              // retrieve only relationships that have at least one persons as desired type
              qb.filter.byEquality('persons.type', EntityType.CONTACT);

              // merge out query builder
              const personsQb = qb.addChildQueryBuilder('person');
              personsQb.merge(this.queryBuilder);

              // remove pagination
              personsQb.paginator.clear();

              // attach condition only if not empty
              if (!personsQb.filter.isEmpty()) {
                // filter only cotnacts
                personsQb.filter.byEquality('type', EntityType.CONTACT);
              }

              // export contact relationships
              this.exportContactsRelationship(qb);
            }
          },
          visible: (): boolean => {
            return ContactModel.canExportRelationships(this.authUser);
          }
        },

        // Import relationships
        {
          label: 'LNG_PAGE_LIST_CONTACTS_ACTION_IMPORT_CONTACTS_RELATIONSHIPS',
          action: {
            link: () => ['/import-export-data', 'relationships', 'import'],
            linkQueryParams: (): Params => {
              return {
                from: Constants.APP_PAGE.CONTACTS.value
              };
            }
          },
          visible: (): boolean => {
            return OutbreakModel.canImportRelationship(this.authUser);
          }
        },

        // Divider
        {
          visible: (): boolean => {
            return (
              ContactModel.canExportDailyFollowUpList(this.authUser) ||
              ContactModel.canExportDailyFollowUpsForm(this.authUser)
            );
          }
        },

        // Export follow up list
        {
          label: 'LNG_PAGE_LIST_CONTACTS_EXPORT_DAILY_FOLLOW_UP_LIST_BUTTON',
          action: {
            click: () => {
              this.dialogV2Service.showExportData({
                title: {
                  get: () =>
                    'LNG_PAGE_LIST_CONTACTS_EXPORT_DAILY_FOLLOW_UP_LIST_TITLE'
                },
                initialized: (handler) => {
                  // display loading
                  handler.loading.show();

                  // dialog fields for daily follow-ups print
                  this.genericDataService
                    .getRangeFollowUpGroupByOptions(true)
                    .subscribe((options) => {
                      // options should be assigned to groupBy
                      (handler.data.map.groupBy as IV2SideDialogConfigInputSingleDropdown).options = options.map((option) => {
                        return {
                          label: option.label,
                          value: option.value
                        };
                      });

                      // hide loading
                      handler.loading.hide();
                    });
                },
                export: {
                  url: `/outbreaks/${this.selectedOutbreak.id}/contacts/daily-list/export`,
                  async: false,
                  method: ExportDataMethod.GET,
                  fileName: `${this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_EXPORT_DAILY_FOLLOW_UP_LIST_TITLE')} - ${moment().format('YYYY-MM-DD')}`,
                  queryBuilder: this.queryBuilder,
                  allow: {
                    types: [ExportDataExtension.PDF]
                  },
                  inputs: {
                    append: [
                      {
                        type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
                        placeholder:
                          'LNG_PAGE_LIST_CONTACTS_EXPORT_FOLLOW_UPS_GROUP_BY_BUTTON',
                        name: 'groupBy',
                        options: [],
                        value: Constants.RANGE_FOLLOW_UP_EXPORT_GROUP_BY.PLACE
                          .value as string,
                        validators: {
                          required: () => true
                        }
                      }
                    ]
                  }
                }
              });
            }
          },
          visible: (): boolean => {
            return ContactModel.canExportDailyFollowUpList(this.authUser);
          }
        },

        // Export daily follow up
        {
          label: 'LNG_PAGE_LIST_CONTACTS_EXPORT_DAILY_FOLLOW_UPS_FORM_BUTTON',
          action: {
            click: () => {
              this.dialogV2Service.showExportData({
                title: {
                  get: () =>
                    'LNG_PAGE_LIST_CONTACTS_EXPORT_DAILY_FOLLOW_UPS_FORM_TITLE'
                },
                export: {
                  url: `/outbreaks/${this.selectedOutbreak.id}/contacts/export-daily-follow-up-form`,
                  async: false,
                  method: ExportDataMethod.GET,
                  fileName: `${this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_EXPORT_DAILY_FOLLOW_UPS_FORM_TITLE')} - ${moment().format('YYYY-MM-DD')}`,
                  allow: {
                    types: [ExportDataExtension.PDF]
                  }
                }
              });
            }
          },
          visible: (): boolean => {
            return ContactModel.canExportDailyFollowUpsForm(this.authUser);
          }
        }
      ]
    };
  }

  /**
   * Initialize table group actions
   */
  protected initializeGroupActions(): void {
    this.groupActions = [
      {
        label: 'LNG_PAGE_LIST_CONTACTS_GROUP_ACTION_EXPORT_SELECTED_CONTACTS',
        action: {
          click: (selected: string[]) => {
            // construct query builder
            const qb = new RequestQueryBuilder();
            qb.filter.bySelect('id', selected, true, null);

            // export
            this.exportContacts(qb);
          }
        },
        visible: (): boolean => {
          return ContactModel.canExport(this.authUser);
        },
        disable: (selected: string[]): boolean => {
          return selected.length < 1;
        }
      },
      {
        label: 'LNG_PAGE_LIST_CONTACTS_GROUP_ACTION_EXPORT_SELECTED_CONTACTS_DOSSIER',
        action: {
          click: (selected: string[]) => {
            // remove id from list
            const anonymizeFields = this.anonymizeFields.filter((item) => {
              return item.value !== 'id';
            });

            // export dossier
            this.dialogV2Service.showExportData({
              title: {
                get: () =>
                  'LNG_PAGE_LIST_CONTACTS_GROUP_ACTION_EXPORT_SELECTED_CONTACTS_DOSSIER_DIALOG_TITLE'
              },
              export: {
                url: `outbreaks/${this.selectedOutbreak.id}/contacts/dossier`,
                async: false,
                method: ExportDataMethod.POST,
                fileName: `${this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_TITLE')} - ${moment().format('YYYY-MM-DD HH:mm')}`,
                extraFormData: {
                  append: {
                    contacts: selected
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
          return ContactModel.canExportDossier(this.authUser);
        },
        disable: (selected: string[]): boolean => {
          return selected.length < 1;
        }
      },
      {
        label:
          'LNG_PAGE_LIST_CONTACTS_GROUP_ACTION_EXPORT_SELECTED_CONTACTS_RELATIONSHIPS',
        action: {
          click: (selected: string[]) => {
            // construct query builder
            const qb = new RequestQueryBuilder();
            const personsQb = qb.addChildQueryBuilder('person');

            // retrieve only relationships that have at least one persons as desired type
            qb.filter.byEquality('persons.type', EntityType.CONTACT);

            // id
            personsQb.filter.bySelect('id', selected, true, null);

            // type
            personsQb.filter.byEquality('type', EntityType.CONTACT);

            // export contact relationships
            this.exportContactsRelationship(qb);
          }
        },
        visible: (): boolean => {
          return ContactModel.canExportRelationships(this.authUser);
        },
        disable: (selected: string[]): boolean => {
          return selected.length < 1;
        }
      },
      {
        label: 'LNG_PAGE_LIST_CONTACTS_GROUP_ACTION_MODIFY_CONTACTS',
        action: {
          link: (): string[] => {
            return ['/contacts', 'modify-bulk'];
          },
          linkQueryParams: (selected: string[]): Params => {
            return {
              contactIds: JSON.stringify(selected)
            };
          }
        },
        visible: (): boolean => {
          return ContactModel.canBulkModify(this.authUser);
        },
        disable: (selected: string[]): boolean => {
          return selected.length < 1;
        }
      }
    ];
  }

  /**
   * Initialize table add action
   */
  protected initializeAddAction(): void {
    this.addAction = {
      type: V2ActionType.ICON_LABEL,
      label: 'LNG_COMMON_BUTTON_ADD',
      icon: 'add_circle_outline',
      action: {
        link: (): string[] => ['/contacts', 'create']
      },
      visible: (): boolean => {
        return ContactModel.canCreate(this.authUser);
      }
    };
  }

  /**
   * Initialize grouped data
   */
  protected initializeGroupedData(): void {
    this.groupedData = {
      label: 'LNG_PAGE_LIST_CONTACTS_ACTION_SHOW_GROUP_BY_RISK_PILLS',
      click: (item, group) => {
        // no need to refresh group
        group.data.blockNextGet = true;

        // remove previous conditions
        this.queryBuilder.filter.removePathCondition('riskLevel');
        this.queryBuilder.filter.removePathCondition('or.riskLevel');

        // filter by group data
        if (!item) {
          this.filterByEquality('riskLevel', null);
        } else if (
          item.label === 'LNG_REFERENCE_DATA_CATEGORY_RISK_LEVEL_UNCLASSIFIED'
        ) {
          // clear
          this.filterByNotHavingValue('riskLevel');
        } else {
          // search
          this.filterByEquality('riskLevel', item.label);
        }
      },
      data: {
        loading: false,
        values: [],
        get: (gData: IV2GroupedData, refreshUI: () => void) => {
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
          return this.contactDataService
            .getContactsGroupedByRiskLevel(
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
                label: string;
                value: number;
                color?: string;
                order?: any;
              }[] = [];
              Object.keys(countResponse.riskLevels || {}).forEach((riskId) => {
                values.push({
                  label: riskId,
                  value: countResponse.riskLevels[riskId].count,
                  color: risk.map[riskId]
                    ? risk.map[riskId].getColorCode()
                    : Constants.DEFAULT_COLOR_REF_DATA,
                  order:
                    risk.map[riskId]?.order !== undefined
                      ? risk.map[riskId].order
                      : Number.MAX_SAFE_INTEGER
                });
              });

              // sort values either by order or label natural order
              values = values.sort((item1, item2) => {
                // if same order, compare labels
                if (item1.order === item2.order) {
                  return this.i18nService
                    .instant(item1.label)
                    .localeCompare(this.i18nService.instant(item2.label));
                }

                // format order
                let order1: number = Number.MAX_SAFE_INTEGER;
                try {
                  order1 = parseInt(item1.order, 10);
                } catch (e) {}
                let order2: number = Number.MAX_SAFE_INTEGER;
                try {
                  order2 = parseInt(item2.order, 10);
                } catch (e) {}

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
      },
      {
        label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
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
      'firstName',
      'visualId',
      'addresses',
      'age',
      'gender',
      'riskLevel',
      'dateOfLastContact',
      'followUpTeamId',
      'followUp',
      'wasCase',
      'responsibleUserId',
      'numberOfContacts',
      'numberOfExposures',
      'questionnaireAnswers',
      'deleted',
      'createdBy',
      'createdAt',
      'updatedBy',
      'updatedAt'
    ];
  }

  /**
   * Export selected records
   */
  private exportContacts(qb: RequestQueryBuilder): void {
    this.dialogV2Service.showExportDataAfterLoadingData({
      title: {
        get: () => 'LNG_PAGE_LIST_CONTACTS_EXPORT_TITLE'
      },
      load: (finished) => {
        // retrieve the list of export fields groups for model
        this.outbreakDataService
          .getExportFieldsGroups(ExportFieldsGroupModelNameEnum.CONTACT)
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
            const contactFieldGroups: ILabelValuePairModel[] =
              fieldsGroupList.options.map((item) => ({
                label: item.name,
                value: item.name
              }));

            // group restrictions
            const contactFieldGroupsRequires: IV2ExportDataConfigGroupsRequired =
              fieldsGroupList.toRequiredList();

            // show export
            finished({
              title: {
                get: () => 'LNG_PAGE_LIST_CONTACTS_EXPORT_TITLE'
              },
              export: {
                url: `/outbreaks/${this.selectedOutbreak.id}/contacts/export`,
                async: true,
                method: ExportDataMethod.POST,
                fileName: `${this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_TITLE')} - ${moment().format('YYYY-MM-DD HH:mm')}`,
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
                    fields: this.anonymizeFields
                  },
                  groups: {
                    fields: contactFieldGroups,
                    required: contactFieldGroupsRequires
                  },
                  dbColumns: true,
                  dbValues: true,
                  jsonReplaceUndefinedWithNull: true,
                  questionnaireVariables: true
                },
                inputs: {
                  append: [
                    {
                      type: V2SideDialogConfigInputType.CHECKBOX,
                      placeholder:
                        'LNG_PAGE_LIST_CONTACTS_EXPORT_CASE_INFORMATION',
                      tooltip: 'LNG_PAGE_LIST_CONTACTS_EXPORT_CASE_INFORMATION_DESCRIPTION',
                      name: 'includeCaseFields',
                      checked: false
                    }
                  ]
                }
              }
            });
          });
      }
    });
  }

  /**
   * Export relationships for selected contacts
   */
  private exportContactsRelationship(qb: RequestQueryBuilder) {
    this.dialogV2Service.showExportDataAfterLoadingData({
      title: {
        get: () => 'LNG_PAGE_LIST_CONTACTS_EXPORT_RELATIONSHIPS_TITLE'
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
            const relationshipFieldGroups: ILabelValuePairModel[] =
              fieldsGroupList.options.map((item) => ({
                label: item.name,
                value: item.name
              }));

            // group restrictions
            const relationshipFieldGroupsRequires: IV2ExportDataConfigGroupsRequired =
              fieldsGroupList.toRequiredList();

            // show export
            finished({
              title: {
                get: () => 'LNG_PAGE_LIST_CONTACTS_EXPORT_RELATIONSHIPS_TITLE'
              },
              export: {
                url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
                async: true,
                method: ExportDataMethod.POST,
                fileName: `${this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_EXPORT_RELATIONSHIP_FILE_NAME')} - ${moment().format('YYYY-MM-DD')}`,
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
   * Change Contact Followup status for all records matching this.queryBuilder
   */
  private changeContactFinalFollowUpStatus() {
    this.dialogV2Service
      .showSideDialog({
        // title
        title: {
          get: () => 'LNG_PAGE_LIST_CONTACTS_ACTION_CHANGE_CONTACT_FINAL_FOLLOW_UP_STATUS_DIALOG_TITLE',
          data: () => {
            return { count: '?' };
          }
        },

        // inputs
        inputs: [
          {
            type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
            placeholder: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS',
            options: (this.activatedRoute.snapshot.data.followUp as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            value: undefined,
            name: 'statusesList',
            validators: {
              required: () => true
            }
          }
        ],

        // buttons
        bottomButtons: [
          {
            label: 'LNG_COMMON_BUTTON_UPDATE',
            type: IV2SideDialogConfigButtonType.OTHER,
            color: 'primary',
            key: 'save',
            disabled: (_data, handler): boolean => {
              return !handler.form || handler.form.invalid;
            }
          }
        ],

        initialized: (handler) => {
          // display loading
          handler.loading.show();

          // construct query for saved filter
          const qb = _.cloneDeep(this.queryBuilder);

          qb.sort.clear();
          qb.paginator.clear();
          qb.fields('id', 'followUp');

          // count contacts
          this.contactDataService.getContactsList(this.selectedOutbreak.id, qb).subscribe(
            (records: ContactModel[]) => {

              handler.update.changeTitle('LNG_PAGE_LIST_CONTACTS_ACTION_CHANGE_CONTACT_FINAL_FOLLOW_UP_STATUS_DIALOG_TITLE', { count: records.length.toLocaleString() });

              handler.data.echo.recordsList = records;

              handler.loading.hide();
            }
          );
        }
      })
      .subscribe((response) => {
        // cancelled ?
        if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
          return;
        }

        // update contacts
        const putRecordsData = response.data.echo.recordsList.map((contact: ContactModel) => ({
          id: contact.id,
          followUp: Object.assign(
            contact.followUp, {
              // status: answer.inputValue.value.followUp.status
              status: (response.handler.data.map.statusesList as IV2SideDialogConfigInputText).value
            }
          )
        }));

        // update statuses
        this.contactDataService
          .bulkModifyContacts(
            this.selectedOutbreak.id,
            putRecordsData
          )
          .pipe(
            catchError((err) => {
              // this.closeLoadingDialog();
              this.toastV2Service.error(err);
              return throwError(err);
            })
          )
          .subscribe(() => {
            // success message
            this.toastV2Service.success(
              'LNG_PAGE_BULK_MODIFY_CONTACTS_ACTION_MODIFY_CONTACTS_SUCCESS_MESSAGE', {
                count: response.data.echo.recordsLIst.options.length.toLocaleString('en')
              }
            );

            // close popup
            response.handler.hide();

            // refresh list
            this.needsRefreshList(true);
          });
      });
  }

  /**
   * Re(load) the Contacts list
   */
  refreshList(triggeredByPageChange: boolean) {
    // retrieve created user & modified user information
    this.queryBuilder.include('createdByUser', true);
    this.queryBuilder.include('updatedByUser', true);

    // retrieve responsible user information
    this.queryBuilder.include('responsibleUser', true);

    // refresh list of contacts grouped by risk level
    if (!triggeredByPageChange) {
      this.initializeGroupedData();
    }

    // retrieve the list of Contacts
    this.contactsList$ = this.contactDataService
      .getContactsList(this.selectedOutbreak.id, this.queryBuilder)
      .pipe(
        switchMap((data) => {
          // determine locations that we need to retrieve
          const locationsIdsMap: {
            [locationId: string]: true;
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
          qb.filter.bySelect('id', locationIds, false, null);

          // retrieve locations
          return this.locationDataService.getLocationsList(qb).pipe(
            map((locations) => {
              // map locations
              const locationsMap: {
                [locationId: string]: LocationModel;
              } = {};
              locations.forEach((location) => {
                locationsMap[location.id] = location;
              });

              // set locations
              data.forEach((item) => {
                (item.addresses || []).forEach((address) => {
                  address.location =
                    address.locationId && locationsMap[address.locationId]
                      ? locationsMap[address.locationId]
                      : address.location;
                });
              });

              // finished
              return data;
            })
          );
        })
      )
      .pipe(
        // process data
        map((contact: ContactModel[]) => {
          return EntityModel.determineAlertness<ContactModel>(
            this.selectedOutbreak.contactInvestigationTemplate,
            contact
          );
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(applyHasMoreLimit?: boolean) {
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
      countQueryBuilder.flag('applyHasMoreLimit', true);
    }

    // count
    this.contactDataService
      .getContactsCount(this.selectedOutbreak.id, countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      )
      .subscribe((response) => {
        this.pageCount = response;
      });
  }
}
