import { Component, OnDestroy } from '@angular/core';
import { ContactModel } from '../../../../core/models/contact.model';
import { IV2SpreadsheetEditorEventDataLocation, IV2SpreadsheetEditorHandler, V2SpreadsheetEditorColumnType } from '../../../../shared/components-v2/app-spreadsheet-editor-v2/models/column.model';
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
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2SpreadsheetEditorChange, V2SpreadsheetEditorChangeType } from '../../../../shared/components-v2/app-spreadsheet-editor-v2/models/change.model';
import { IV2SpreadsheetEditorExtendedColDefEditorColumnMap } from '../../../../shared/components-v2/app-spreadsheet-editor-v2/models/extended-column.model';
import { moment } from '../../../../core/helperClasses/x-moment';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { TeamModel } from '../../../../core/models/team.model';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { ClusterModel } from '../../../../core/models/cluster.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import * as _ from 'lodash';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-contacts-bulk-create-modify',
  templateUrl: './contacts-bulk-create-modify.component.html'
})
export class ContactsBulkCreateModifyComponent extends BulkCreateModifyComponent<EntityModel> implements OnDestroy {
  // entity
  private _entity: EventModel | CaseModel;

  // used to keep timer id
  private _displayOnceGeoLocationChangeTimeout: any;

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

  /**
   * Constructor
   */
  constructor(
    protected authDataService: AuthDataService,
    protected outbreakDataService: OutbreakDataService,
    protected activatedRoute: ActivatedRoute,
    protected contactDataService: ContactDataService,
    protected dialogV2Service: DialogV2Service,
    protected toastV2Service: ToastV2Service,
    protected router: Router
  ) {
    // parent
    super(
      activatedRoute,
      authDataService,
      outbreakDataService
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
    // column
    this.tableColumns = [
      // Contact properties
      {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME',
        field: 'model.firstName',
        validators: {
          required: () => true
        }
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_CONTACT_FIELD_LABEL_MIDDLE_NAME',
        field: 'model.middleName'
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_CONTACT_FIELD_LABEL_LAST_NAME',
        field: 'model.lastName'
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_CONTACT_FIELD_LABEL_GENDER',
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
                data.change.type === V2SpreadsheetEditorChangeType.VALUES
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

          // change pregnancy status cell state read only/editable
          // - this triggers refresh cells too
          data.handler.cellReadonly(
            data.rowIndex,
            data.columnsMap['model.pregnancyStatus'].index,
            contact.gender === Constants.GENDER_MALE
          );

          // refresh sheet
          data.handler.redraw();
        }
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_CONTACT_FIELD_LABEL_PREGNANCY_STATUS',
        field: 'model.pregnancyStatus',
        options: (this.activatedRoute.snapshot.data.pregnancyStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_CONTACT_FIELD_LABEL_OCCUPATION',
        field: 'model.occupation',
        options: (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
      }, {
        type: V2SpreadsheetEditorColumnType.NUMBER,
        label: 'LNG_CONTACT_FIELD_LABEL_AGE_YEARS',
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
        field: 'model.dob'
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_CONTACT_FIELD_LABEL_VISUAL_ID',
        field: 'model.visualId',
        visible: this.isCreate,
        validators: {
          async: (rowData: EntityModel) => {
            // set visual ID validator
            return this.contactDataService
              .checkContactVisualIDValidity(
                this.selectedOutbreak.id,
                ContactModel.generateContactIDMask(this.selectedOutbreak.contactIdMask),
                (rowData.model as ContactModel).visualId
              );
          }
        }
      },

      // Contact Document(s)
      {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_TYPE',
        field: 'model.documents[0].type',
        visible: this.isCreate,
        options: this.isCreate ?
          (this.activatedRoute.snapshot.data.documentType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options :
          []
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_NUMBER',
        field: 'model.documents[0].number',
        visible: this.isCreate
      },

      // Contact Address(es)
      {
        type: V2SpreadsheetEditorColumnType.DATE,
        label: 'LNG_PAGE_BULK_ADD_CONTACTS_ADDRESS_DATE',
        field: 'model.mainAddress.date'
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_ADDRESS_FIELD_LABEL_EMAIL_ADDRESS',
        field: 'model.mainAddress.emailAddress',
        validators: {
          email: () => true
        }
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_CONTACT_FIELD_LABEL_PHONE_NUMBER',
        field: 'model.mainAddress.phoneNumber'
      }, {
        type: V2SpreadsheetEditorColumnType.LOCATION,
        label: 'LNG_ADDRESS_FIELD_LABEL_LOCATION',
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
        field: 'model.mainAddress.city'
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE',
        field: 'model.mainAddress.postalCode'
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1',
        field: 'model.mainAddress.addressLine1'
      }, {
        type: V2SpreadsheetEditorColumnType.NUMBER,
        label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LAT',
        field: 'model.mainAddress.geoLocation.lat',
        validators: {
          required: (rowData: EntityModel) => {
            const contact: ContactModel = rowData.model as ContactModel;
            return contact.mainAddress &&
              typeof contact.mainAddress.geoLocation?.lng === 'number';
          }
        }
      }, {
        type: V2SpreadsheetEditorColumnType.NUMBER,
        label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LNG',
        field: 'model.mainAddress.geoLocation.lng',
        validators: {
          required: (rowData: EntityModel) => {
            const contact: ContactModel = rowData.model as ContactModel;
            return contact.mainAddress &&
              typeof contact.mainAddress.geoLocation?.lat === 'number';
          }
        }
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_ADDRESS_FIELD_LABEL_MANUAL_COORDINATES',
        field: 'model.mainAddress.geoLocationAccurate',
        options: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options
      },

      // Epidemiology
      {
        type: V2SpreadsheetEditorColumnType.DATE,
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
        field: 'model.dateOfReporting',
        validators: {
          required: () => true,
          date: () => ({
            max: moment()
          })
        }
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
        field: 'model.isDateOfReportingApproximate',
        options: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_CONTACT_FIELD_LABEL_RISK_LEVEL',
        field: 'model.riskLevel',
        options: (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_CONTACT_FIELD_LABEL_RISK_REASON',
        field: 'model.riskReason'
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_TEAM_ID',
        field: 'model.followUpTeamId',
        visible: TeamModel.canList(this.authUser),
        options: TeamModel.canList(this.authUser) ?
          (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<ReferenceDataEntryModel>).options :
          []
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS',
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
        field: 'relationship.dateOfFirstContact',
        visible: this.isCreate,
        validators: {
          date: () => ({
            max: moment()
          })
        }
      }, {
        type: V2SpreadsheetEditorColumnType.DATE,
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE',
        field: 'relationship.contactDate',
        visible: this.isCreate,
        validators: {
          required: () => true,
          date: () => ({
            max: moment()
          })
        }
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED',
        field: 'relationship.contactDateEstimated',
        visible: this.isCreate,
        options: this.isCreate ?
          (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options :
          []
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL',
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
        field: 'relationship.exposureTypeId',
        visible: this.isCreate,
        options: this.isCreate ?
          (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options :
          []
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY',
        field: 'relationship.exposureFrequencyId',
        visible: this.isCreate,
        options: this.isCreate ?
          (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options :
          []
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION',
        field: 'relationship.exposureDurationId',
        visible: this.isCreate,
        options: this.isCreate ?
          (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options :
          []
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION',
        field: 'relationship.socialRelationshipTypeId',
        visible: this.isCreate,
        options: this.isCreate ?
          (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options :
          []
      }, {
        type: V2SpreadsheetEditorColumnType.SINGLE_SELECT,
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER',
        field: 'relationship.clusterId',
        visible: this.isCreate,
        options: this.isCreate ?
          (this.activatedRoute.snapshot.data.cluster as IResolverV2ResponseModel<ClusterModel>).options :
          []
      }, {
        type: V2SpreadsheetEditorColumnType.TEXT,
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP',
        field: 'relationship.socialRelationshipDetail',
        visible: this.isCreate
      }, {
        type: V2SpreadsheetEditorColumnType.TEXTAREA,
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_COMMENT',
        field: 'relationship.comment',
        visible: this.isCreate
      }
    ];
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
    const contactIds = this.activatedRoute.snapshot.queryParams.contactIds ? JSON.parse(this.activatedRoute.snapshot.queryParams.contactIds) : [];

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
    this.records$ = this.contactDataService
      .getContactsList(
        this.selectedOutbreak.id,
        qb
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
    if (this._geoData.contacts.length < 1) {
      return;
    }

    // wait to gather all data
    if (waitForTimer) {
      // call again
      this._displayOnceGeoLocationChangeTimeout = setTimeout(
        () => {
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
    this.dialogV2Service
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
   * Save handler
   */
  save(event) {
    // #TODO - handle modify
    if (this.isModify) {
      throw new Error('bla bla bla');
    }

    // create contacts
    this.contactDataService
      .bulkAddContacts(
        this.selectedOutbreak.id,
        this._entity.type,
        this._entity.id,
        event.rows.map((row: EntityModel) => {
          // clone contact
          const contact: ContactModel = new ContactModel(_.cloneDeep(row.model));

          // remove empty address
          if (
            contact.addresses.length === 1 &&
            contact.addresses[0].typeId === AddressType.CURRENT_ADDRESS &&
            !AddressModel.isNotEmpty(contact.addresses[0])
          ) {
            contact.addresses = [];
          }

          // format as API expects it
          return {
            contact,
            relationship: row.relationship
          };
        })
      )
      // #TODO
      // .pipe(
      //   catchError((err) => {
      //     // close dialog
      //     loadingDialog.close();
      //
      //     // mark success records
      //     this.errorMessages = [];
      //     if (dataResponse.sheetCore) {
      //       // display partial success message
      //       if (!_.isEmpty(_.get(err, 'details.success'))) {
      //         this.errorMessages.push({
      //           message: 'LNG_PAGE_BULK_ADD_CONTACTS_LABEL_PARTIAL_ERROR_MSG'
      //         });
      //       }
      //
      //       // remove success records
      //       // items should be ordered by recordNo
      //       //  - so in this case if we reverse we can remove records from sheet without having to take in account that we removed other rows as well
      //       (_.get(err, 'details.success') || []).reverse().forEach((successRecord) => {
      //         // remove record that was added
      //         if (_.isNumber(successRecord.recordNo)) {
      //           // remove row
      //           dataResponse.sheetCore.alter(
      //             'remove_row',
      //             successRecord.recordNo,
      //             1
      //           );
      //
      //           // substract row numbers
      //           _.each(
      //             _.get(err, 'details.failed'),
      //             (item) => {
      //               if (!_.isNumber(item.recordNo)) {
      //                 return;
      //               }
      //
      //               // if record is after the one that we removed then we need to substract 1 value
      //               if (item.recordNo > successRecord.recordNo) {
      //                 item.recordNo = item.recordNo - 1;
      //               }
      //             }
      //           );
      //         }
      //       });
      //     }
      //
      //     // prepare errors to parse later into more readable errors
      //     const errors = [];
      //     (_.get(err, 'details.failed') || []).forEach((childError) => {
      //       if (!_.isEmpty(childError.error)) {
      //         errors.push({
      //           err: childError.error,
      //           echo: childError
      //         });
      //       }
      //     });
      //
      //     // try to parse into more clear errors
      //     this.toastV2Service.translateErrors(errors)
      //       .subscribe((translatedErrors) => {
      //         // transform errors
      //         (translatedErrors || []).forEach((translatedError) => {
      //           // determine row number
      //           let row: number = _.get(translatedError, 'echo.recordNo', null);
      //           if (_.isNumber(row)) {
      //             row++;
      //           }
      //
      //           // add to error list
      //           this.errorMessages.push({
      //             message: 'LNG_PAGE_BULK_ADD_CONTACTS_LABEL_API_ERROR_MSG',
      //             data: {
      //               row: row,
      //               err: translatedError.message
      //             }
      //           });
      //         });
      //       });
      //
      //     // display error
      //     this.toastV2Service.error(err);
      //     return throwError(err);
      //   })
      // )
      .subscribe(() => {
        // message
        this.toastV2Service.success('LNG_PAGE_BULK_ADD_CONTACTS_ACTION_CREATE_CONTACTS_SUCCESS_MESSAGE');

        // finished
        event.finished();

        // #TODO
        // this.disableDirtyConfirm();

        // navigate to listing page
        if (ContactModel.canList(this.authUser)) {
          this.router.navigate(['/contacts']);
        } else {
          this.router.navigate(['/']);
        }
      });
  }


  // // constants
  // private static readonly COLUMN_PROPERTY_LAST_CONTACT: string = 'relationship.contactDate';
  // private static readonly COLUMN_PROPERTY_DATE: string = 'contact.addresses[0].date';
  // private static readonly COLUMN_PROPERTY_EMAIL_ADDRESS: string = 'contact.addresses[0].emailAddress';
  // private static readonly COLUMN_PROPERTY_PHONE_NUMBER: string = 'contact.addresses[0].phoneNumber';
  // private static readonly COLUMN_PROPERTY_LOCATION: string = 'contact.addresses[0].locationId';
  // private static readonly COLUMN_PROPERTY_CITY: string = 'contact.addresses[0].city';
  // private static readonly COLUMN_PROPERTY_POSTAL_CODE: string = 'contact.addresses[0].postalCode';
  // private static readonly COLUMN_PROPERTY_ADDRESS_LINE1: string = 'contact.addresses[0].addressLine1';
  // private static readonly COLUMN_PROPERTY_GEOLOCATION_LAT: string = 'contact.addresses[0].geoLocation.lat';
  // private static readonly COLUMN_PROPERTY_GEOLOCATION_LNG: string = 'contact.addresses[0].geoLocation.lng';
  // private static readonly COLUMN_PROPERTY_GEOLOCATION_ACCURATE: string = 'contact.addresses[0].geoLocationAccurate';
  //
  // @ViewChild('inputForMakingFormDirty', { static: true }) inputForMakingFormDirty;
  // @ViewChild('hotTableWrapper', { static: true }) hotTableWrapper: HotTableWrapperComponent;
  //
  // // selected outbreak
  // selectedOutbreak: OutbreakModel;
  // // related entity
  // relatedEntityType: EntityType;
  // relatedEntityId: string;
  //
  // relatedEntityData: CaseModel | EventModel;
  //
  // // sheet widget configuration
  // sheetContextMenu = {};
  // sheetColumns: any[] = [];
  //
  // // sheet column indexes
  // private _addressColumnIndexes: IAddressColumnIndex;
  // private _addressColumnIndexesMap: {
  //   [columnIndex: number]: true
  // } = {};
  //
  // // manual cleared "date" cells
  // private _manualClearedDateCells: {
  //   [rowNumber: number]: true
  // } = {};
  //
  // // error messages
  // errorMessages: {
  //   message: string,
  //   data?: {
  //     row: number,
  //     columns?: string,
  //     err?: string
  //   }
  // }[] = [];
  //
  // // warning messages
  // private _warnings: {
  //   dateOfOnset: string | null,
  //   rows: {
  //     [rowIndex: number]: true
  //   }
  // } = {
  //     dateOfOnset: null,
  //     rows: {}
  //   };
  //
  // // action
  // actionButton: IV2ActionIconLabel;
  //
  // /**
  //  * Constructor
  //  */
  // constructor(
  //   private router: Router,
  //   private activatedRoute: ActivatedRoute,
  //   private contactDataService: ContactDataService,
  //   private entityDataService: EntityDataService,
  //   private outbreakDataService: OutbreakDataService,
  //   private toastV2Service: ToastV2Service,
  //   private i18nService: I18nService,
  //   private dialogV2Service: DialogV2Service,
  //   private authDataService: AuthDataService,
  //   private teamDataService: TeamDataService
  // ) {
  //   super();
  // }
  //
  // /**
  //  * Component initialized
  //  */
  // ngOnInit() {
  //   // get the authenticated user
  //   this.authUser = this.authDataService.getAuthenticatedUser();
  //
  //
  //   // teams
  //   if (TeamModel.canList(this.authUser)) {
  //     this.teamList$ = this.teamDataService.getTeamsListReduced().pipe(share());
  //   }
  //
  //   // configure Sheet widget
  //   this.configureSheetWidget();
  //
  //   // retrieve query params
  //   this.activatedRoute.queryParams
  //     .subscribe((params: { entityType, entityId }) => {
  //       this.relatedEntityType = _.get(params, 'entityType');
  //       this.relatedEntityId = _.get(params, 'entityId');
  //
  //       if (!this.validateRelatedEntity()) {
  //         return;
  //       }
  //
  //       // initialize page breadcrumbs
  //       this.initializeBreadcrumbs();
  //
  //       // retrieve related person information
  //       this.retrieveRelatedPerson();
  //     });
  // }
  //
  // /**
  //  * Component destroyed
  //  */
  // ngOnDestroy() {
  //   // remove global notifications
  //   this.toastV2Service.hide(AppMessages.APP_MESSAGE_LAST_CONTACT_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET);
  // }
  //
  // /**
  //  * Configure 'Handsontable'
  //  */
  // private configureSheetWidget() {
  //
  //   // configure the context menu
  //   this.sheetContextMenu = {
  //     items: {
  //       row_above: {
  //         name: this.i18nService.instant('LNG_SHEET_CONTEXT_MENU_ROW_ABOVE')
  //       },
  //       row_below: {
  //         name: this.i18nService.instant('LNG_SHEET_CONTEXT_MENU_ROW_BELOW')
  //       },
  //       remove_row: {
  //         name: this.i18nService.instant('LNG_SHEET_CONTEXT_MENU_REMOVE_ROW')
  //       },
  //       cut: {
  //         name: this.i18nService.instant('LNG_SHEET_CONTEXT_MENU_CUT')
  //       },
  //       copy: {
  //         name: this.i18nService.instant('LNG_SHEET_CONTEXT_MENU_COPY')
  //       }
  //     }
  //   };
  //
  //   // get address column indexes
  //   this._addressColumnIndexes = {
  //     date: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_DATE),
  //     emailAddress: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_EMAIL_ADDRESS),
  //     phoneNumber: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_PHONE_NUMBER),
  //     locationId: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_LOCATION),
  //     city: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_CITY),
  //     postalCode: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_POSTAL_CODE),
  //     addressLine1: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_ADDRESS_LINE1),
  //     geoLocationLat: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_GEOLOCATION_LAT),
  //     geoLocationLng: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_GEOLOCATION_LNG),
  //     geoLocationAccurate: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_GEOLOCATION_ACCURATE)
  //   };
  //
  //   // map address column indexes
  //   this._addressColumnIndexesMap = Object.assign({}, ...Object.values(this._addressColumnIndexes).map((index: number) => ({ [index]: true })));
  // }
  //
  // /**
  //  * After changes
  //  */
  // afterChange(event: IHotTableWrapperEvent) {
  //   // validate if only there are changes
  //   if (!event.typeSpecificData.changes) {
  //     return;
  //   }
  //
  //   // get the contact date column index
  //   const lastContactColumnIndex: number = this.hotTableWrapper.sheetColumns.findIndex((column) => column.property === BulkCreateContactsComponent.COLUMN_PROPERTY_LAST_CONTACT);
  //
  //   // check if the date of onset or address fields were changed
  //   let refreshWarning = false;
  //   let isLastContactDateModified = false;
  //   event.typeSpecificData.changes.forEach((cell: any) => {
  //     // cell[0] - row number, cell[1] - column index, cell[2] - old value, cell[3] - new value
  //     const columnIndex: number = cell[1];
  //
  //     // check changed column
  //     if (this._addressColumnIndexesMap[columnIndex]) {
  //       // address fields
  //       this.setAddressDate(
  //         event.sheetTable,
  //         cell
  //       );
  //     } else if (
  //       columnIndex === lastContactColumnIndex &&
  //       this.selectedOutbreak.checkLastContactDateAgainstDateOnSet
  //     ) {
  //       // validate last contact against date of onset
  //       isLastContactDateModified = true;
  //       const mustRefreshWarning = this.checkForLastContactBeforeCaseOnSet(cell);
  //       refreshWarning = refreshWarning || mustRefreshWarning;
  //     }
  //   });
  //
  //   // show warnings if only last contact cell was modified
  //   if (isLastContactDateModified) {
  //     this.showWarnings(refreshWarning);
  //   }
  // }
  //
  // /**
  //  * Check if "Date of Last Contact" is before "Date of Onset" of the source case
  //  */
  // private checkForLastContactBeforeCaseOnSet(
  //   cell: any
  // ): boolean {
  //   // cell[0] - row number, cell[1] - column index, cell[2] - old value, cell[3] - new value
  //   const rowNumber = cell[0];
  //   const newValue = cell[3];
  //   let refreshWarning = false;
  //
  //   // check if there is a new value
  //   if (
  //     newValue &&
  //     moment(newValue).isValid() &&
  //     this.relatedEntityData instanceof CaseModel &&
  //     this.relatedEntityData.dateOfOnset &&
  //     moment(newValue).isBefore(moment(this.relatedEntityData.dateOfOnset))
  //   ) {
  //     this._warnings.dateOfOnset = moment(this.relatedEntityData.dateOfOnset).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
  //     this._warnings.rows[rowNumber + 1] = true;
  //
  //     refreshWarning = true;
  //   } else {
  //     // remove the row if exists
  //     if (this._warnings.rows[rowNumber + 1]) {
  //       refreshWarning = true;
  //       delete this._warnings.rows[rowNumber + 1];
  //     }
  //   }
  //
  //   // return
  //   return refreshWarning;
  // }
  //
  // /**
  //  * Sets "date" address field to current date if it's not set
  //  */
  // private setAddressDate(
  //   sheetTable: HotTableComponent,
  //   cell: any[]
  // ): void {
  //   // get cell info
  //   const rowNumber: number = cell[0];
  //   const columnIndex: number = cell[1];
  //   const newValue: string = cell[3];
  //
  //   // return if the date was manually cleared
  //   if (this._manualClearedDateCells[rowNumber]) {
  //     return;
  //   }
  //
  //   // check if "date" was changed
  //   if (columnIndex === this._addressColumnIndexes.date) {
  //     // save if date was manually cleared
  //     if (!newValue) {
  //       this._manualClearedDateCells[rowNumber] = true;
  //     }
  //
  //     // return
  //     return;
  //   }
  //
  //   // return if "date" field is filled
  //   const sheetCore: Handsontable.default = (sheetTable as any).hotInstance;
  //   if (
  //     sheetCore.getDataAtCell(
  //       rowNumber,
  //       this._addressColumnIndexes.date
  //     )
  //   ) {
  //     return;
  //   }
  //
  //   // set "date" address field to current date if at least an address field is filled
  //   if (this.isAddressFilled(rowNumber)) {
  //     sheetCore.setDataAtCell(
  //       rowNumber,
  //       this._addressColumnIndexes.date,
  //       moment().format(Constants.DEFAULT_DATE_DISPLAY_FORMAT)
  //     );
  //   }
  // }
  //
  // /**
  //  * Checks if any of the address field is filled
  //  */
  // private isAddressFilled(
  //   rowNumber: number,
  //   ignoredColumn: number = this._addressColumnIndexes.date
  // ): boolean {
  //   // sheet core
  //   const sheetCore: Handsontable.default = (this.hotTableWrapper.sheetTable as any).hotInstance;
  //
  //   // check fields
  //   const indexesFiltered: number[] = Object.values(this._addressColumnIndexes).filter((item) => item !== ignoredColumn);
  //   for (const column of Object.values(indexesFiltered)) {
  //     // get "date" column value
  //     const value: any = sheetCore.getDataAtCell(
  //       rowNumber,
  //       column
  //     );
  //
  //     // break if any address field is filled
  //     if (value) {
  //       return true;
  //     }
  //   }
  //
  //   // no address field filled
  //   return false;
  // }
  //
  // /**
  //  * Show warnings
  //  */
  // private showWarnings(refreshWarning) {
  //   // hide previous message if the warning message was updated
  //   if (refreshWarning) {
  //     this.toastV2Service.hide(AppMessages.APP_MESSAGE_LAST_CONTACT_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET);
  //   }
  //
  //   // show the warning message
  //   if (Object.keys(this._warnings.rows).length) {
  //     this.toastV2Service.notice(
  //       'LNG_PAGE_BULK_ADD_CONTACTS_ACTION_CREATE_CONTACTS_WARNING_LAST_CONTACT_IS_BEFORE_DATE_OF_ONSET',
  //       {
  //         dateOfOnset: this._warnings.dateOfOnset,
  //         rows: Object.keys(this._warnings.rows).join(', ')
  //       },
  //       AppMessages.APP_MESSAGE_LAST_CONTACT_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET
  //     );
  //   }
  // }
  //
  // /**
  //  * After changes
  //  */
  // afterBecameDirty() {
  //   // no input to make dirty ?
  //   if (!this.inputForMakingFormDirty) {
  //     return;
  //   }
  //
  //   // make form dirty
  //   this.inputForMakingFormDirty.control.markAsDirty();
  // }
  //
  // /**
  //  * Retrieve information of related person (Case or Event)
  //  */
  // private retrieveRelatedPerson() {
  //   if (
  //     this.selectedOutbreak &&
  //     this.selectedOutbreak.id &&
  //     this.relatedEntityType &&
  //     this.relatedEntityId
  //   ) {
  //     // retrieve related person information
  //     this.entityDataService
  //       .getEntity(this.relatedEntityType, this.selectedOutbreak.id, this.relatedEntityId)
  //       .pipe(
  //         catchError((err) => {
  //           // show error message
  //           this.toastV2Service.error(err);
  //
  //           // navigate to Cases/Events listing page
  //           this.redirectToRelatedEntityList();
  //
  //           return throwError(err);
  //         })
  //       )
  //       .subscribe((relatedEntityData: CaseModel | EventModel) => {
  //         // keep person data
  //         this.relatedEntityData = relatedEntityData;
  //       });
  //   }
  // }
  //
  // /**
  //  * Check that we have related Person Type and ID
  //  */
  // private validateRelatedEntity() {
  //   if (
  //     this.relatedEntityId &&
  //     (
  //       this.relatedEntityType === EntityType.CASE ||
  //       this.relatedEntityType === EntityType.EVENT
  //     )
  //   ) {
  //     return true;
  //   }
  //
  //   // related person data is wrong or missing
  //   this.toastV2Service.success('LNG_PAGE_BULK_ADD_CONTACTS_WARNING_CASE_OR_EVENT_REQUIRED');
  //
  //   // navigate to Cases/Events listing page
  //   this.redirectToRelatedEntityList();
  //
  //   return false;
  // }
  //
  // /**
  //  * Redirect to Cases or Events list, based on related Entity Type
  //  */
  // private redirectToRelatedEntityList() {
  //   if (
  //     this.relatedEntityType === EntityType.CASE &&
  //     CaseModel.canList(this.authUser)
  //   ) {
  //     this.router.navigate(['/cases']);
  //   } else if (
  //     this.relatedEntityType === EntityType.EVENT &&
  //     EventModel.canList(this.authUser)
  //   ) {
  //     this.router.navigate(['/events']);
  //   } else {
  //     // NOT SUPPORTED
  //     if (ContactModel.canList(this.authUser)) {
  //       this.router.navigate(['/contacts']);
  //     } else {
  //       this.router.navigate(['/']);
  //     }
  //   }
  // }
}
