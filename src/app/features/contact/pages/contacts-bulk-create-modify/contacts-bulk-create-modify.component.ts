import { Component, OnDestroy } from '@angular/core';
import { ContactModel } from '../../../../core/models/contact.model';
import {
  IV2SpreadsheetEditorEventData,
  IV2SpreadsheetEditorEventDataLocation,
  IV2SpreadsheetEditorHandler,
  V2SpreadsheetEditorColumnType
} from '../../../../shared/components-v2/app-spreadsheet-editor-v2/models/column.model';
import { BulkCreateModifyComponent } from '../../../../core/helperClasses/bulk-create-modify-component';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CaseModel } from '../../../../core/models/case.model';
import { EventModel } from '../../../../core/models/event.model';
import { EntityType } from '../../../../core/models/entity-type';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { Constants } from '../../../../core/models/constants';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2SpreadsheetEditorChange, V2SpreadsheetEditorChangeType } from '../../../../shared/components-v2/app-spreadsheet-editor-v2/models/change.model';
import { IV2SpreadsheetEditorExtendedColDefEditorColumnMap } from '../../../../shared/components-v2/app-spreadsheet-editor-v2/models/extended-column.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { TeamModel } from '../../../../core/models/team.model';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { ClusterModel } from '../../../../core/models/cluster.model';
import * as _ from 'lodash';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import {
  catchError,
  map,
  switchMap
} from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AppMessages } from '../../../../core/enums/app-messages.enum';
import { BulkCacheHelperService } from '../../../../core/services/helper/bulk-cache-helper.service';
import { ReferenceDataHelperService } from '../../../../core/services/helper/reference-data-helper.service';
import { PersonAndRelatedHelperService } from '../../../../core/services/helper/person-and-related-helper.service';
import { V2SpreadsheetEditorColumnToVisibleMandatoryConf } from '../../../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';
import { LocalizationHelper } from '../../../../core/helperClasses/localization-helper';

@Component({
  selector: 'app-contacts-bulk-create-modify',
  templateUrl: './contacts-bulk-create-modify.component.html'
})
export class ContactsBulkCreateModifyComponent extends BulkCreateModifyComponent<EntityModel, V2SpreadsheetEditorColumnToVisibleMandatoryConf> implements OnDestroy {
  // entity
  private _entity: EventModel | CaseModel;

  // used to keep timer id
  private _displayOnceGeoLocationChangeTimeout: number;

  // keep data used to copy geolocation
  private _geoData: {
    contacts: {
      rowIndex: number,
      contact: ContactModel
    }[],
    handler: IV2SpreadsheetEditorHandler,
    locationsMap: {
      [locationId: string]: IV2SpreadsheetEditorEventDataLocation
    },
    columnsMap: IV2SpreadsheetEditorExtendedColDefEditorColumnMap
  } = {
      contacts: [],
      handler: undefined,
      locationsMap: undefined,
      columnsMap: undefined
    };

  // warning messages
  private _warnings: {
    dateOfOnset: string | null,
    rows: {
      [rowIndex: number]: true
    }
  } = {
      dateOfOnset: null,
      rows: {}
    };

  // manual cleared "date" cells
  private _manualClearedDateCells: {
    [rowNumber: number]: true
  } = {};

  /**
   * Constructor
   */
  constructor(
    protected authDataService: AuthDataService,
    protected outbreakDataService: OutbreakDataService,
    protected activatedRoute: ActivatedRoute,
    protected router: Router,
    protected bulkCacheHelperService: BulkCacheHelperService,
    protected referenceDataHelperService: ReferenceDataHelperService,
    protected personAndRelatedHelperService: PersonAndRelatedHelperService
  ) {
    // parent
    super(
      activatedRoute,
      authDataService,
      outbreakDataService,
      personAndRelatedHelperService, {
        initializeTableColumnsAfterRecordsInitialized: true
      }
    );

    // retrieve data
    this._entity = this.activatedRoute.snapshot.data.entity;
  }

  /**
   * Component destroyed
   */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();

    // stop timer
    this.stopDisplayOnceGeoLocationChange();

    // remove global notifications
    this.personAndRelatedHelperService.toastV2Service.hide(AppMessages.APP_MESSAGE_LAST_CONTACT_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET);

    // clear bulk cache
    this.clearBulkCache();
  }

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    this.pageTitle = this.isCreate ?
      'LNG_PAGE_BULK_ADD_CONTACTS_TITLE' :
      'LNG_PAGE_BULK_MODIFY_CONTACTS_TITLE';
  }

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs(): void {
    // reset
    this.breadcrumbs = [{
      label: 'LNG_COMMON_LABEL_HOME',
      action: {
        link: DashboardModel.canViewDashboard(this.authUser) ?
          ['/dashboard'] :
          ['/account/my-profile']
      }
    }];

    // case or event?
    if (this._entity?.type === EntityType.CASE) {
      // case list
      if (CaseModel.canList(this.authUser)) {
        this.breadcrumbs.push({
          label: 'LNG_PAGE_LIST_CASES_TITLE',
          action: {
            link: ['/cases']
          }
        });
      }

      // case view
      if (CaseModel.canView(this.authUser)) {
        this.breadcrumbs.push({
          label: this._entity.name,
          action: {
            link: [`/cases/${ this._entity.id }/view`]
          }
        });
      }
    } else if (this._entity?.type === EntityType.EVENT) {
      // event list
      if (EventModel.canList(this.authUser)) {
        this.breadcrumbs.push({
          label: 'LNG_PAGE_LIST_EVENTS_TITLE',
          action: {
            link: ['/events']
          }
        });
      }

      // event view
      if (EventModel.canView(this.authUser)) {
        this.breadcrumbs.push({
          label: this._entity.name,
          action: {
            link: [`/events/${ this._entity.id }/view`]
          }
        });
      }
    } else {
      // NOT SUPPORTED :)
    }

    // contacts list page
    if (ContactModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
        action: {
          link: ['/contacts']
        }
      });
    }

    // current page breadcrumb
    this.breadcrumbs.push({
      label: this.isCreate ?
        'LNG_PAGE_BULK_ADD_CONTACTS_TITLE' :
        'LNG_PAGE_BULK_MODIFY_CONTACTS_TITLE',
      action: null
    });
  }

  /**
   * Initialize Table Columns
   */
  protected initializeTableColumns(): void {
    // retrieve records data
    const records: EntityModel[] = this.spreadsheetEditorV2Component.getRecords<EntityModel>();

    // column
    this.tableColumns = [
      // Contact properties
      {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'firstName'
        },
        field: 'model.firstName',
        validators: {
          required: () => true
        }
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_CONTACT_FIELD_LABEL_MIDDLE_NAME',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'middleName'
        },
        field: 'model.middleName'
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_CONTACT_FIELD_LABEL_LAST_NAME',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'lastName'
        },
        field: 'model.lastName'
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_CONTACT_FIELD_LABEL_GENDER',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'gender'
        },
        field: 'model.gender',
        options: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        change: (data) => {
          // check if it's "male"
          const entity: EntityModel = data.rowData;
          const contact: ContactModel = entity.model as ContactModel;
          if (contact.gender === Constants.GENDER_MALE) {
            // only if we need to change
            if (contact.pregnancyStatus) {
              // save change
              const newValue = null;
              if (
                data.change &&
                data.change.type === V2SpreadsheetEditorChangeType.VALUES &&
                data.columnsMap['model.pregnancyStatus']
              ) {
                // initialize
                if (!data.change.changes.rows[data.rowIndex]) {
                  data.change.changes.rows[data.rowIndex] = {
                    columns: {}
                  };
                }

                // set change
                data.change.changes.rows[data.rowIndex].columns[data.columnsMap['model.pregnancyStatus'].index] = {
                  old: contact.pregnancyStatus,
                  new: newValue
                };
              }

              // reset pregnancy status value
              contact.pregnancyStatus = newValue;

              // update validation
              data.handler.rowValidate(data.rowIndex);
            }
          }

          // refresh sheet
          data.handler.redraw();
        }
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_CONTACT_FIELD_LABEL_PREGNANCY_STATUS',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'pregnancyStatus'
        },
        field: 'model.pregnancyStatus',
        options: (this.activatedRoute.snapshot.data.pregnancyStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        readonly: (rowData: EntityModel) => {
          return (rowData.model as ContactModel).gender === Constants.GENDER_MALE;
        }
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_CONTACT_FIELD_LABEL_OCCUPATION',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'occupation'
        },
        field: 'model.occupation',
        options: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          records.map((item) => (item.model as ContactModel).occupation)
        )
      }, {
        type: V2SpreadsheetEditorColumnType.NUMBER,
        label: 'LNG_CONTACT_FIELD_LABEL_AGE_YEARS',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'ageDob'
        },
        field: 'model.age.years',
        validators: {
          integer: () => ({
            min: 0,
            max: Constants.DEFAULT_AGE_MAX_YEARS
          })
        }
      }, {
        type: V2SpreadsheetEditorColumnType.NUMBER,
        label: 'LNG_CONTACT_FIELD_LABEL_AGE_MONTHS',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'ageDob'
        },
        field: 'model.age.months',
        validators: {
          integer: () => ({
            min: 0,
            max: 11
          })
        }
      }, {
        type: V2SpreadsheetEditorColumnType.DATE,
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_BIRTH',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'ageDob'
        },
        field: 'model.dob'
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_CONTACT_FIELD_LABEL_VISUAL_ID',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'visualId'
        },
        field: 'model.visualId',
        visible: this.isCreate,
        validators: {
          async: (rowData: EntityModel) => {
            // set visual ID validator
            return this.personAndRelatedHelperService.contact.contactDataService
              .checkContactVisualIDValidity(
                this.selectedOutbreak.id,
                this.personAndRelatedHelperService.contact.generateContactIDMask(this.selectedOutbreak.contactIdMask),
                (rowData.model as ContactModel).visualId
              );
          }
        }
      },

      // Contact Document(s)
      {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_TYPE',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'documents.type'
        },
        field: 'model.documents[0].type',
        visible: this.isCreate,
        options: this.isCreate ?
          (this.activatedRoute.snapshot.data.documentType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options :
          [],
        validators: {
          required: (rowData: EntityModel) => {
            const contact: ContactModel = rowData.model as ContactModel;
            return contact.documents?.length &&
              !!contact.documents[0].number;
          }
        }
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_NUMBER',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'documents.number'
        },
        field: 'model.documents[0].number',
        visible: this.isCreate,
        validators: {
          required: (rowData: EntityModel) => {
            const contact: ContactModel = rowData.model as ContactModel;
            return contact.documents?.length &&
              !!contact.documents[0].type;
          }
        }
      },

      // Contact Address(es)
      {
        type: V2SpreadsheetEditorColumnType.DATE,
        label: 'LNG_PAGE_BULK_ADD_CONTACTS_ADDRESS_DATE',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'addresses.date'
        },
        field: 'model.mainAddress.date',
        change: (data) => {
          this.setAddressDate(data);
        }
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_ADDRESS_FIELD_LABEL_EMAIL_ADDRESS',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'addresses.emailAddress'
        },
        field: 'model.mainAddress.emailAddress',
        validators: {
          email: () => true
        },
        change: (data) => {
          this.setAddressDate(data);
        }
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_CONTACT_FIELD_LABEL_PHONE_NUMBER',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'addresses.phoneNumber'
        },
        field: 'model.mainAddress.phoneNumber',
        change: (data) => {
          this.setAddressDate(data);
        }
      }, {
        type: V2SpreadsheetEditorColumnType.LOCATION,
        label: 'LNG_ADDRESS_FIELD_LABEL_LOCATION',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'addresses.locationId'
        },
        field: 'model.mainAddress.locationId',
        change: (data) => {
          // push it to changes that we need to handle
          this._geoData.handler = data.handler;
          this._geoData.locationsMap = data.locationsMap;
          this._geoData.columnsMap = data.columnsMap;
          this._geoData.contacts.push({
            rowIndex: data.rowIndex,
            contact: (data.rowData as EntityModel).model as ContactModel
          });

          // since fill will call this method for each row / cell we need to show dialog only once
          this.displayOnceGeoLocationChange(true);

          // set address date
          this.setAddressDate(data);
        },
        validators: {
          required: (rowData: EntityModel): boolean => {
            const contact: ContactModel = rowData.model as ContactModel;
            return AddressModel.isNotEmpty(contact.mainAddress);
          }
        }
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_ADDRESS_FIELD_LABEL_CITY',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'addresses.city'
        },
        field: 'model.mainAddress.city',
        change: (data) => {
          this.setAddressDate(data);
        }
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'addresses.postalCode'
        },
        field: 'model.mainAddress.postalCode',
        change: (data) => {
          this.setAddressDate(data);
        }
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'addresses.addressLine1'
        },
        field: 'model.mainAddress.addressLine1',
        change: (data) => {
          this.setAddressDate(data);
        }
      }, {
        type: V2SpreadsheetEditorColumnType.NUMBER,
        label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LAT',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'addresses.geoLocation',
          keepRequired: true
        },
        field: 'model.mainAddress.geoLocation.lat',
        validators: {
          required: (rowData: EntityModel) => {
            const contact: ContactModel = rowData.model as ContactModel;
            return contact.mainAddress &&
              typeof contact.mainAddress.geoLocation?.lng === 'number';
          }
        },
        change: (data) => {
          this.setAddressDate(data);
        }
      }, {
        type: V2SpreadsheetEditorColumnType.NUMBER,
        label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LNG',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'addresses.geoLocation',
          keepRequired: true
        },
        field: 'model.mainAddress.geoLocation.lng',
        validators: {
          required: (rowData: EntityModel) => {
            const contact: ContactModel = rowData.model as ContactModel;
            return contact.mainAddress &&
              typeof contact.mainAddress.geoLocation?.lat === 'number';
          }
        },
        change: (data) => {
          this.setAddressDate(data);
        }
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_CONTACT_FIELD_LABEL_ADDRESS_MANUAL_COORDINATES',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'addresses.geoLocationAccurate'
        },
        field: 'model.mainAddress.geoLocationAccurate',
        options: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        change: (data) => {
          this.setAddressDate(data);
        }
      },

      // Epidemiology
      {
        type: V2SpreadsheetEditorColumnType.DATE,
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'dateOfReporting'
        },
        field: 'model.dateOfReporting',
        validators: {
          required: () => true,
          date: () => ({
            max: LocalizationHelper.now()
          })
        }
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'isDateOfReportingApproximate'
        },
        field: 'model.isDateOfReportingApproximate',
        options: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_CONTACT_FIELD_LABEL_RISK_LEVEL',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'riskLevel'
        },
        field: 'model.riskLevel',
        options: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          records.map((item) => (item.model as ContactModel).riskLevel)
        )
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_CONTACT_FIELD_LABEL_RISK_REASON',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'riskReason'
        },
        field: 'model.riskReason'
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_TEAM_ID',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'followUpTeamId'
        },
        field: 'model.followUpTeamId',
        visible: TeamModel.canList(this.authUser),
        options: TeamModel.canList(this.authUser) ?
          (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<ReferenceDataEntryModel>).options :
          []
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          field: 'followUp[status]'
        },
        field: 'model.followUp.status',
        visible: this.isModify,
        options: this.isModify ?
          (this.activatedRoute.snapshot.data.followUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options :
          []
      },

      // Relationship properties
      {
        type: V2SpreadsheetEditorColumnType.DATE,
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_DATE_OF_FIRST_CONTACT',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.relationship.visibleMandatoryKey,
          field: 'dateOfFirstContact'
        },
        field: 'relationship.dateOfFirstContact',
        visible: this.isCreate,
        validators: {
          date: () => ({
            max: LocalizationHelper.now()
          })
        }
      }, {
        type: V2SpreadsheetEditorColumnType.DATE,
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.relationship.visibleMandatoryKey,
          field: 'contactDate'
        },
        field: 'relationship.contactDate',
        visible: this.isCreate,
        validators: {
          required: () => true,
          date: () => ({
            max: LocalizationHelper.now()
          })
        },
        change: (data) => {
          // nothing to do ?
          if (!this.selectedOutbreak.checkLastContactDateAgainstDateOnSet) {
            return;
          }

          // check if there is a new value
          let refreshWarning: boolean = false;
          const newValue = (data.rowData as EntityModel).relationship?.contactDate;
          if (
            newValue &&
            LocalizationHelper.toMoment(newValue).isValid() &&
            this._entity instanceof CaseModel &&
            this._entity.dateOfOnset &&
            LocalizationHelper.toMoment(newValue).isBefore(LocalizationHelper.toMoment(this._entity.dateOfOnset))
          ) {
            this._warnings.dateOfOnset = LocalizationHelper.displayDate(this._entity.dateOfOnset);
            this._warnings.rows[data.rowIndex + 1] = true;
            refreshWarning = true;
          } else {
            // remove the row if exists
            if (this._warnings.rows[data.rowIndex + 1]) {
              refreshWarning = true;
              delete this._warnings.rows[data.rowIndex + 1];
            }
          }

          // hide previous message if the warning message was updated
          if (refreshWarning) {
            this.personAndRelatedHelperService.toastV2Service.hide(AppMessages.APP_MESSAGE_LAST_CONTACT_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET);
          }

          // show the warning message
          if (Object.keys(this._warnings.rows).length) {
            this.personAndRelatedHelperService.toastV2Service.notice(
              'LNG_PAGE_BULK_ADD_CONTACTS_ACTION_CREATE_CONTACTS_WARNING_LAST_CONTACT_IS_BEFORE_DATE_OF_ONSET',
              {
                dateOfOnset: this._warnings.dateOfOnset,
                rows: Object.keys(this._warnings.rows).join(', ')
              },
              AppMessages.APP_MESSAGE_LAST_CONTACT_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET
            );
          }
        }
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.relationship.visibleMandatoryKey,
          field: 'contactDateEstimated'
        },
        field: 'relationship.contactDateEstimated',
        visible: this.isCreate,
        options: this.isCreate ?
          (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options :
          []
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.relationship.visibleMandatoryKey,
          field: 'certaintyLevelId'
        },
        field: 'relationship.certaintyLevelId',
        visible: this.isCreate,
        options: this.isCreate ?
          (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options :
          [],
        validators: {
          required: () => true
        }
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.relationship.visibleMandatoryKey,
          field: 'exposureTypeId'
        },
        field: 'relationship.exposureTypeId',
        visible: this.isCreate,
        options: this.isCreate ?
          this.referenceDataHelperService.filterPerOutbreakOptions(
            this.selectedOutbreak,
            (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            records.map((item) => item.relationship.exposureTypeId)
          ) :
          []
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.relationship.visibleMandatoryKey,
          field: 'exposureFrequencyId'
        },
        field: 'relationship.exposureFrequencyId',
        visible: this.isCreate,
        options: this.isCreate ?
          this.referenceDataHelperService.filterPerOutbreakOptions(
            this.selectedOutbreak,
            (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            records.map((item) => item.relationship.exposureFrequencyId)
          ) :
          []
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.relationship.visibleMandatoryKey,
          field: 'exposureDurationId'
        },
        field: 'relationship.exposureDurationId',
        visible: this.isCreate,
        options: this.isCreate ?
          this.referenceDataHelperService.filterPerOutbreakOptions(
            this.selectedOutbreak,
            (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            records.map((item) => item.relationship.exposureDurationId)
          ) :
          []
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.relationship.visibleMandatoryKey,
          field: 'socialRelationshipTypeId'
        },
        field: 'relationship.socialRelationshipTypeId',
        visible: this.isCreate,
        options: this.isCreate ?
          this.referenceDataHelperService.filterPerOutbreakOptions(
            this.selectedOutbreak,
            (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            records.map((item) => item.relationship.socialRelationshipTypeId)
          ) :
          []
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.relationship.visibleMandatoryKey,
          field: 'clusterId'
        },
        field: 'relationship.clusterId',
        visible: this.isCreate,
        options: this.isCreate ?
          (this.activatedRoute.snapshot.data.cluster as IResolverV2ResponseModel<ClusterModel>).options :
          []
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.relationship.visibleMandatoryKey,
          field: 'socialRelationshipDetail'
        },
        field: 'relationship.socialRelationshipDetail',
        visible: this.isCreate
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_COMMENT',
        visibleMandatory: {
          key: this.personAndRelatedHelperService.relationship.visibleMandatoryKey,
          field: 'comment'
        },
        field: 'relationship.comment',
        visible: this.isCreate
      }
    ];
  }

  /**
   * Initialize Ignore Groups
   */
  protected initializeSaveIgnoreGroups(): void {
    this.saveIgnoreGroups = [
      'model',
      'relationship'
    ];
  }

  /**
   * Initialize Field replace
   */
  protected initializeSaveFieldReplace(): void {
    this.saveFieldReplace = {
      'model.mainAddress': 'model.addresses'
    };
  }

  /**
   * Initialize Table Columns
   */
  protected initializeRecords(): void {
    // nothing to do ?
    if (this.isCreate) {
      return;
    }

    // retrieve data
    const contactIds: string[] = this.bulkCacheHelperService.getBulkSelected(this.activatedRoute.snapshot.queryParams.cacheKey);
    if (!contactIds?.length) {
      // invalid data provide
      // - show warning and redirect back to list page
      this.personAndRelatedHelperService.toastV2Service.notice('LNG_GENERIC_WARNING_BULK_CACHE_EXPIRED');

      // redirect
      this.disableDirtyConfirm();
      if (ContactModel.canList(this.authUser)) {
        this.router.navigate(['/contacts']);
      } else {
        this.router.navigate(['/']);
      }
    }

    // create search query builder to retrieve our contacts
    const qb = new RequestQueryBuilder();
    qb.filter.bySelect(
      'id',
      contactIds,
      true,
      null
    );

    // retrieve contacts
    // - throwError is handled by spreadsheet editor
    this.records$ = this.personAndRelatedHelperService.contact.contactDataService
      .getContactsList(
        this.selectedOutbreak.id,
        qb,
        true
      )
      .pipe(
        // transform
        map((contactModels) => {
          return contactModels.map((contact) => {
            // initialize entity
            const entity: EntityModel = new EntityModel({
              type: contact.type
            });

            // no need for relationship, only contact is relevant on bulk modify
            entity.model = contact;

            // finish
            return entity;
          });
        })
      );
  }

  /**
   * Generate a new record
   */
  newRecord(): EntityModel {
    // create contact
    const contact = new ContactModel();

    // one main address
    contact.addresses = [new AddressModel({
      typeId: AddressType.CURRENT_ADDRESS
    })];

    // reset value
    contact.mainAddress.geoLocationAccurate = undefined;

    // we need age to be empty for grid validation to work properly on creation
    contact.age.years = undefined;
    contact.age.months = undefined;

    // initialize relationship
    const relationship: RelationshipModel = new RelationshipModel();

    // reset value
    relationship.contactDateEstimated = undefined;

    // initialize entity model
    const entity: EntityModel = new EntityModel({
      type: contact.type
    });

    // main data
    entity.model = contact;
    entity.relationship = relationship;

    // finished
    return entity;
  }

  /**
   * Release timer
   */
  private stopDisplayOnceGeoLocationChange(): void {
    if (this._displayOnceGeoLocationChangeTimeout) {
      clearTimeout(this._displayOnceGeoLocationChangeTimeout);
      this._displayOnceGeoLocationChangeTimeout = undefined;
    }
  }

  /**
   * Copy Geo location ?
   */
  private displayOnceGeoLocationChange(waitForTimer: boolean): void {
    // stop previous
    this.stopDisplayOnceGeoLocationChange();

    // nothing to do ?
    if (
      this._geoData.contacts.length < 1 ||
      !this.shouldVisibleMandatoryTableColumnBeVisible(
        this.personAndRelatedHelperService.contact.visibleMandatoryKey,
        'addresses.geoLocation'
      )
    ) {
      return;
    }

    // wait to gather all data
    if (waitForTimer) {
      // call again
      this._displayOnceGeoLocationChangeTimeout = setTimeout(
        () => {
          // reset
          this._displayOnceGeoLocationChangeTimeout = undefined;

          // call
          this.displayOnceGeoLocationChange(false);
        },
        300
      );

      // finished
      return;
    }

    // check if we have at least one location with geo data
    let foundProperGeoLocation: boolean = false;
    for (let dataIndex = 0; dataIndex < this._geoData.contacts.length; dataIndex++) {
      const data = this._geoData.contacts[dataIndex];
      if (
        data.contact.mainAddress?.locationId &&
        this._geoData.locationsMap &&
        typeof this._geoData.locationsMap[data.contact.mainAddress.locationId]?.geoLocation?.lat === 'number' &&
        typeof this._geoData.locationsMap[data.contact.mainAddress.locationId]?.geoLocation?.lng === 'number' && (
          this._geoData.locationsMap[data.contact.mainAddress.locationId].geoLocation.lat !== data.contact.mainAddress.geoLocation?.lat ||
          this._geoData.locationsMap[data.contact.mainAddress.locationId].geoLocation.lng !== data.contact.mainAddress.geoLocation?.lng
        )
      ) {
        foundProperGeoLocation = true;
        break;
      }
    }

    // cleanup
    const cleanup = () => {
      // cleanup
      this._geoData.contacts = [];
      this._geoData.handler = undefined;
      this._geoData.locationsMap = undefined;
      this._geoData.columnsMap = undefined;
    };

    // nothing to do ?
    if (!foundProperGeoLocation) {
      // cleanup
      cleanup();

      // finished
      return;
    }

    // ask for confirmation if we should copy location lat & lng
    this.personAndRelatedHelperService.dialogV2Service
      .showConfirmDialog({
        config: {
          title: {
            get: () => 'LNG_COMMON_LABEL_ATTENTION_REQUIRED'
          },
          message: {
            get: () => 'LNG_DIALOG_CONFIRM_REPLACE_GEOLOCATION'
          }
        }
      })
      .subscribe((response) => {
        // canceled ?
        if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
          // cleanup
          cleanup();

          // finished
          return;
        }

        // change location lat & lng
        const change: V2SpreadsheetEditorChange = {
          type: V2SpreadsheetEditorChangeType.VALUES,
          changes: {
            rows: {}
          }
        };
        for (let dataIndex = 0; dataIndex < this._geoData.contacts.length; dataIndex++) {
          // update contact
          const data = this._geoData.contacts[dataIndex];
          if (
            data.contact.mainAddress?.locationId &&
            this._geoData.locationsMap &&
            typeof this._geoData.locationsMap[data.contact.mainAddress.locationId]?.geoLocation?.lat === 'number' &&
            typeof this._geoData.locationsMap[data.contact.mainAddress.locationId]?.geoLocation?.lng === 'number' && (
              this._geoData.locationsMap[data.contact.mainAddress.locationId].geoLocation.lat !== data.contact.mainAddress.geoLocation?.lat ||
              this._geoData.locationsMap[data.contact.mainAddress.locationId].geoLocation.lng !== data.contact.mainAddress.geoLocation?.lng
            )
          ) {
            // data
            const newLat: number = this._geoData.locationsMap[data.contact.mainAddress.locationId].geoLocation.lat;
            const newLng: number = this._geoData.locationsMap[data.contact.mainAddress.locationId].geoLocation.lng;

            // add change
            if (!change.changes.rows[data.rowIndex]) {
              change.changes.rows[data.rowIndex] = {
                columns: {}
              };
            }
            change.changes.rows[data.rowIndex].columns[this._geoData.columnsMap['model.mainAddress.geoLocation.lat'].index] = {
              old: data.contact.mainAddress.geoLocation?.lat,
              new: newLat
            };
            change.changes.rows[data.rowIndex].columns[this._geoData.columnsMap['model.mainAddress.geoLocation.lng'].index] = {
              old: data.contact.mainAddress.geoLocation?.lng,
              new: newLng
            };

            // change data
            data.contact.mainAddress.geoLocation = {
              lat: newLat,
              lng: newLng
            };
          }

          // update validation
          this._geoData.handler.rowValidate(data.rowIndex);
        }

        // add change
        this._geoData.handler.addChange(change);

        // redraw sheet
        this._geoData.handler.redraw();

        // cleanup
        cleanup();
      });
  }

  /**
   * Sets "date" address field to current date if it's not set
   */
  private setAddressDate(data: IV2SpreadsheetEditorEventData): void {
    // return if the date was manually cleared
    if (
      !this.isCreate ||
      this._manualClearedDateCells[data.rowIndex]
    ) {
      return;
    }

    // next time no need to fill date
    this._manualClearedDateCells[data.rowIndex] = true;

    // nothing else filled ?
    const entity: EntityModel = data.rowData;
    if (
      entity.model.mainAddress &&
      !AddressModel.isNotEmpty(entity.model.mainAddress)
    ) {
      return;
    }

    // do we need to set date ?
    if (!entity.model.mainAddress?.date) {
      // set date
      entity.model.mainAddress.date = LocalizationHelper.displayDate(LocalizationHelper.now());

      // update grid
      data.handler.rowValidate(data.rowIndex);
      data.handler.redraw();
    }
  }

  /**
   * Save handler
   */
  save(event) {
    // generate follow-ups callback
    const generateFollowUps = ((
      contactIds: string[],
      catchErrorsTriggered: () => void,
      error?: any
    ) => {
      return this.personAndRelatedHelperService.followUp.followUpsDataService
        .generateFollowUps(
          this.selectedOutbreak.id,
          {
            personType: EntityType.CONTACT,
            contactIds
          }
        )
        .pipe(
          catchError((generateFollowupsError) => {
            // show error
            this.personAndRelatedHelperService.toastV2Service.error(generateFollowupsError);

            // continue to show errors
            catchErrorsTriggered();

            // return error
            return error ?
              throwError(error) :
              throwError(generateFollowupsError);
          })
        );
    });

    // configure save request
    let request$;
    if (this.isCreate) {
      // determine data that we need to save
      const data = event.rows.map((row) => {
        // clone contact
        const fullEntity: EntityModel = row.full;
        const dirtyEntity: EntityModel = row.dirty;
        const contact: ContactModel = dirtyEntity.model as ContactModel;

        // remove empty address
        if (
          contact.addresses &&
          contact.addresses.length === 1 &&
          contact.addresses[0].typeId === AddressType.CURRENT_ADDRESS &&
          !AddressModel.isNotEmpty(contact.addresses[0])
        ) {
          contact.addresses = [];
        }

        // remove empty documents
        if (
          contact.documents?.length === 1 && (
            !contact.documents[0] || (
              !contact.documents[0].type &&
              !contact.documents[0].number
            )
          )
        ) {
          contact.documents = [];
        }

        // format as API expects it
        return {
          contact,
          relationship: fullEntity.relationship
        };
      });

      // create
      request$ = this.personAndRelatedHelperService.contact.contactDataService
        .bulkAddContacts(
          this.selectedOutbreak.id,
          this._entity.type,
          this._entity.id,
          data
        );
    } else {
      // determine data that we need to save
      const data = event.rows.reduce(
        (acc: any[], row) => {
          // no need to update ?
          if (
            !row.dirty?.model ||
            Object.keys(row.dirty.model).length < 1
          ) {
            return;
          }

          // add data
          acc.push({
            id: row.full.model.id,
            ...row.dirty.model
          });

          // finished
          return acc;
        },
        []
      );

      // modify
      request$ = this.personAndRelatedHelperService.contact.contactDataService.bulkModifyContacts(
        this.selectedOutbreak.id,
        data
      );
    }

    // create / modify contacts
    request$
      .pipe(
        catchError((err) => {
          // display partial success message
          if (!_.isEmpty(_.get(err, 'details.success'))) {
            this.personAndRelatedHelperService.toastV2Service.error('LNG_PAGE_BULK_ADD_CONTACTS_LABEL_PARTIAL_ERROR_MSG');
          }

          // remove success records
          // items should be ordered by recordNo
          //  - so in this case if we reverse we can remove records from sheet without having to take in account that we removed other rows as well
          const rowsToDelete: number[] = [];
          const contactIds: string[] = [];
          (_.get(err, 'details.success') || []).reverse().forEach((successRecord) => {
            // remove record that was added
            if (typeof successRecord.recordNo === 'number') {
              // remove row
              rowsToDelete.push(successRecord.recordNo);

              // get the created contacts
              if (
                this.isCreate &&
                this.selectedOutbreak.generateFollowUpsWhenCreatingContacts &&
                successRecord.contact
              ) {
                contactIds.push(successRecord.contact.id);
              }

              // subtract row numbers
              _.each(
                _.get(err, 'details.failed'),
                (item) => {
                  if (typeof item.recordNo !== 'number') {
                    return;
                  }

                  // if record is after the one that we removed then we need to substract 1 value
                  if (item.recordNo > successRecord.recordNo) {
                    item.recordNo = item.recordNo - 1;
                  }
                }
              );
            }
          });

          // show error action
          const showErrors = () => {
            // remove success rows
            if (rowsToDelete.length > 0) {
              event.removeRows(rowsToDelete);
            }

            // prepare errors to parse later into more readable errors
            const errors = [];
            (_.get(err, 'details.failed') || []).forEach((childError) => {
              if (!_.isEmpty(childError.error)) {
                errors.push({
                  err: childError.error,
                  echo: childError
                });
              }
            });

            // try to parse into more clear errors
            this.personAndRelatedHelperService.toastV2Service.translateErrors(errors)
              .subscribe((translatedErrors) => {
                // transform errors
                (translatedErrors || []).forEach((translatedError) => {
                  // determine row number
                  let row: number = _.get(translatedError, 'echo.recordNo', null);
                  if (typeof row === 'number') {
                    row++;
                  }

                  // add to error list
                  this.personAndRelatedHelperService.toastV2Service.error(
                    'LNG_PAGE_BULK_ADD_CONTACTS_LABEL_API_ERROR_MSG', {
                      row: row + '',
                      err: translatedError.message
                    }
                  );
                });
              });

            // close dialog
            event.finished();
          };

          // generate follow-ups ?
          if (contactIds.length > 0) {
            return generateFollowUps(
              contactIds,
              showErrors,
              err
            ).pipe(
              switchMap(() => {
                // continue to show errors
                showErrors();

                // finished
                return throwError(err);
              })
            );
          } else {
            // continue to show errors
            showErrors();

            // finished
            return throwError(err);
          }
        })
      )
      .subscribe((result: {
        recordNo: number,
        contact: ContactModel,
        relationship?: RelationshipModel
      }[]) => {
        // redirect action
        const redirect = (successToken) => {
          // show success message
          this.personAndRelatedHelperService.toastV2Service.success(successToken);

          // finished
          event.finished();

          // navigate to listing page
          this.disableDirtyConfirm();
          if (ContactModel.canList(this.authUser)) {
            this.router.navigate(['/contacts']);
          } else {
            this.router.navigate(['/']);
          }
        };

        // message
        if (this.isCreate) {
          // get the created contacts
          const contactIds: string[] = result.map((item) => item.contact.id);

          // generate follow-ups ?
          if (
            this.selectedOutbreak.generateFollowUpsWhenCreatingContacts &&
            contactIds.length > 0
          ) {
            generateFollowUps(
              contactIds,
              () => {
                redirect('LNG_PAGE_BULK_ADD_CONTACTS_ACTION_CREATE_CONTACTS_SUCCESS_MESSAGE');
              }
            ).subscribe(() => {
              redirect('LNG_PAGE_BULK_ADD_CONTACTS_ACTION_CREATE_CONTACTS_SUCCESS_MESSAGE');
            });
          } else {
            redirect('LNG_PAGE_BULK_ADD_CONTACTS_ACTION_CREATE_CONTACTS_SUCCESS_MESSAGE');
          }
        } else {
          redirect('LNG_PAGE_BULK_MODIFY_CONTACTS_ACTION_MODIFY_CONTACTS_SUCCESS_MESSAGE');
        }
      });
  }

  /**
   * Clear bulk cache
   */
  private clearBulkCache(): void {
    // clear bulk cache
    this.bulkCacheHelperService.removeBulkSelected(this.activatedRoute.snapshot.queryParams.cacheKey);
  }
}
