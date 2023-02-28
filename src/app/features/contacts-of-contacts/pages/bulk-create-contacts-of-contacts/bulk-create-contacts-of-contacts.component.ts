import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import {
  HotTableWrapperComponent,
  IHotTableWrapperEvent
} from '../../../../shared/components/hot-table-wrapper/hot-table-wrapper.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { catchError, share } from 'rxjs/operators';
import * as _ from 'lodash';
import { Observable, of, Subscription, throwError } from 'rxjs';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { UserModel } from '../../../../core/models/user.model';
import { DateSheetColumn, DropdownSheetColumn, IntegerSheetColumn, LocationSheetColumn, NumericSheetColumn, TextSheetColumn } from '../../../../core/models/sheet/sheet.model';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/xt-forms/validators/general-async-validator.directive';
import { moment } from '../../../../core/helperClasses/x-moment';
import { Constants } from '../../../../core/models/constants';
import * as Handsontable from 'handsontable';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { IV2ActionIconLabel, V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { CellProperties } from 'handsontable/settings';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { HotTableComponent } from '@handsontable/angular';
import { IAddressColumnIndex } from '../../../../core/models/address.interface';

@Component({
  selector: 'app-bulk-create-contacts-of-contacts',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './bulk-create-contacts-of-contacts.component.html',
  styleUrls: ['./bulk-create-contacts-of-contacts.component.scss']
})
export class BulkCreateContactsOfContactsComponent extends ConfirmOnFormChanges implements OnInit, OnDestroy {
  // constants
  private static readonly COLUMN_PROPERTY_DATE: string = 'contactOfContact.addresses[0].date';
  private static readonly COLUMN_PROPERTY_EMAIL_ADDRESS: string = 'contactOfContact.addresses[0].emailAddress';
  private static readonly COLUMN_PROPERTY_PHONE_NUMBER: string = 'contactOfContact.addresses[0].phoneNumber';
  private static readonly COLUMN_PROPERTY_LOCATION: string = 'contactOfContact.addresses[0].locationId';
  private static readonly COLUMN_PROPERTY_CITY: string = 'contactOfContact.addresses[0].city';
  private static readonly COLUMN_PROPERTY_POSTAL_CODE: string = 'contactOfContact.addresses[0].postalCode';
  private static readonly COLUMN_PROPERTY_ADDRESS_LINE1: string = 'contactOfContact.addresses[0].addressLine1';
  private static readonly COLUMN_PROPERTY_GEOLOCATION_LAT: string = 'contactOfContact.addresses[0].geoLocation.lat';
  private static readonly COLUMN_PROPERTY_GEOLOCATION_LNG: string = 'contactOfContact.addresses[0].geoLocation.lng';
  private static readonly COLUMN_PROPERTY_GEOLOCATION_ACCURATE: string = 'contactOfContact.addresses[0].geoLocationAccurate';

  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  @ViewChild('inputForMakingFormDirty', { static: true }) inputForMakingFormDirty;
  @ViewChild('hotTableWrapper', { static: true }) hotTableWrapper: HotTableWrapperComponent;

  // selected outbreak
  selectedOutbreak: OutbreakModel;
  relatedEntityId: string;

  // contact options
  genderList$: Observable<ILabelValuePairModel[]>;
  occupationsList$: Observable<ILabelValuePairModel[]>;
  riskLevelsList$: Observable<ILabelValuePairModel[]>;
  documentTypesList$: Observable<ILabelValuePairModel[]>;
  yesNoList$: Observable<ILabelValuePairModel[]>;
  pregnancyStatusList$: Observable<ILabelValuePairModel[]>;

  // relationship options
  certaintyLevelOptions$: Observable<ILabelValuePairModel[]>;
  exposureTypeOptions$: Observable<ILabelValuePairModel[]>;
  exposureFrequencyOptions$: Observable<ILabelValuePairModel[]>;
  exposureDurationOptions$: Observable<ILabelValuePairModel[]>;
  socialRelationshipOptions$: Observable<ILabelValuePairModel[]>;
  clusterList$: Observable<ILabelValuePairModel[]>;

  relatedEntityData: ContactModel;

  // sheet widget configuration
  sheetContextMenu = {};
  sheetColumns: any[] = [];

  // address column indexes
  private _addressColumnIndexes: IAddressColumnIndex;

  // manual cleared "date" cells
  private _manualClearedDateCells: {
    [rowNumber: number]: true
  } = {};

  // error messages
  errorMessages: {
    message: string,
    data?: {
      row: number,
      columns?: string,
      err?: string
    }
  }[] = [];

  contactOfContactVisualIdModel: {
    mask: string
  };

  // action
  actionButton: IV2ActionIconLabel;

  // subscribers
  outbreakSubscriber: Subscription;

  // authenticated user details
  authUser: UserModel;

  /**
   * Constructor
   */
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private contactDataService: ContactDataService,
    private contactsOfContactsDataService: ContactsOfContactsDataService,
    private outbreakDataService: OutbreakDataService,
    private toastV2Service: ToastV2Service,
    private i18nService: I18nService,
    private dialogV2Service: DialogV2Service,
    private authDataService: AuthDataService
  ) {
    super();
  }

  /**
   * Component initialized
   */
  ngOnInit() {
    // get the authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    // reference data
    this.genderList$ = of((this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.occupationsList$ = of((this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.riskLevelsList$ = of((this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.documentTypesList$ = of((this.activatedRoute.snapshot.data.documentType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.certaintyLevelOptions$ = of((this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.exposureTypeOptions$ = of((this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.exposureFrequencyOptions$ = of((this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.exposureDurationOptions$ = of((this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.socialRelationshipOptions$ = of((this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.yesNoList$ = of((this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.pregnancyStatusList$ = of((this.activatedRoute.snapshot.data.pregnancyStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.clusterList$ = of((this.activatedRoute.snapshot.data.cluster as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());

    // configure Sheet widget
    this.configureSheetWidget();

    // retrieve query params
    this.activatedRoute.queryParams
      .subscribe((params: { entityId }) => {
        this.relatedEntityId = _.get(params, 'entityId');

        if (!this.validateRelatedEntity()) {
          return;
        }

        // initialize page breadcrumbs
        this.initializeBreadcrumbs();

        // retrieve related person information
        this.retrieveRelatedPerson();
      });

    // get selected outbreak
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreak()
      .pipe(
        catchError((err) => {
          // show error message
          this.toastV2Service.error(err);

          // navigate to Contacts listing page
          this.redirectToContactListPage();
          return throwError(err);
        })
      )
      .subscribe((selectedOutbreak: OutbreakModel) => {
        this.selectedOutbreak = selectedOutbreak;
        // setting the contact visual id model
        this.contactOfContactVisualIdModel = {
          mask : ContactOfContactModel.generateContactOfContactIDMask(this.selectedOutbreak.contactOfContactIdMask)
        };

        this.retrieveRelatedPerson();
      });

    // action button
    this.actionButton = {
      type: V2ActionType.ICON_LABEL,
      icon: '',
      label: 'LNG_COMMON_BUTTON_SAVE',
      action: {
        click: () => {
          this.addContactsOfContacts();
        }
      }
    };
  }

  /**
   * Component destroyed
   */
  ngOnDestroy() {
    // outbreak subscriber
    if (this.outbreakSubscriber) {
      this.outbreakSubscriber.unsubscribe();
      this.outbreakSubscriber = null;
    }
  }

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs() {
    // reset
    this.breadcrumbs = [{
      label: 'LNG_COMMON_LABEL_HOME',
      action: {
        link: DashboardModel.canViewDashboard(this.authUser) ?
          ['/dashboard'] :
          ['/account/my-profile']
      }
    }];

    // contact list
    if (ContactModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
        action: {
          link: ['/contacts']
        }
      });
    }

    // contacts list page
    if (ContactOfContactModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE',
        action: {
          link: ['/contacts-of-contacts']
        }
      });
    }

    // current page breadcrumb
    this.breadcrumbs.push({
      label: 'LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_TITLE',
      action: null
    });
  }

  /**
   * Configure 'Handsontable'
   */
  private configureSheetWidget() {
    // configure columns
    this.sheetColumns = [
      // Contact of Contact properties
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME')
        .setProperty('contactOfContact.firstName')
        .setRequired(),
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_MIDDLE_NAME')
        .setProperty('contactOfContact.middleName'),
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME')
        .setProperty('contactOfContact.lastName'),
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER')
        .setProperty('contactOfContact.gender')
        .setOptions(this.genderList$, this.i18nService),
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_PREGNANCY_STATUS')
        .setProperty('contactOfContact.pregnancyStatus')
        .setOptions(this.pregnancyStatusList$, this.i18nService),
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID')
        .setProperty('contactOfContact.visualId')
        .setAsyncValidator((value: string, _cellProperties: CellProperties, callback: (result: boolean) => void): void => {
          if (_.isEmpty(value)) {
            callback(true);
          } else {
            const visualIDTranslateData = {
              mask: ContactOfContactModel.generateContactOfContactIDMask(this.selectedOutbreak.contactOfContactIdMask)
            };
            // set visual ID validator
            this.contactsOfContactsDataService.checkContactOfContactVisualIDValidity(
              this.selectedOutbreak.id,
              visualIDTranslateData.mask,
              value
            )
              .pipe(
                catchError((err) => {
                  callback(false);
                  return throwError(err);
                })
              )
              .subscribe((isValid: boolean | IGeneralAsyncValidatorResponse) => {
                if (isValid === true) {
                  callback(true);
                } else {
                  callback(false);
                }
              });
          }
        }),
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION')
        .setProperty('contactOfContact.occupation')
        .setOptions(this.occupationsList$, this.i18nService),
      new IntegerSheetColumn(
        0,
        Constants.DEFAULT_AGE_MAX_YEARS)
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE_YEARS')
        .setProperty('contactOfContact.age.years'),
      new IntegerSheetColumn(
        0,
        11)
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE_MONTHS')
        .setProperty('contactOfContact.age.months'),
      new DateSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_BIRTH')
        .setProperty('contactOfContact.dob'),

      // Contact Document(s)
      new DropdownSheetColumn()
        .setTitle('LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_TYPE')
        .setProperty('contactOfContact.documents[0].type')
        .setOptions(this.documentTypesList$, this.i18nService),
      new TextSheetColumn()
        .setTitle('LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_NUMBER')
        .setProperty('contactOfContact.documents[0].number'),

      // Contact Address(es)
      new DateSheetColumn()
        .setTitle('LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_ADDRESS_DATE')
        .setProperty(BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_DATE),
      new TextSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_EMAIL_ADDRESS')
        .setProperty(BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_EMAIL_ADDRESS)
        .setAsyncValidator((value: string, _cellProperties: CellProperties, callback: (result: boolean) => void): void => {
          if (!value) {
            callback(true);
          } else {
            // validate email
            callback(Constants.REGEX_EMAIL_VALIDATOR.test(value));
          }
        }),
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_PHONE_NUMBER')
        .setProperty(BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_PHONE_NUMBER),
      new LocationSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_LOCATION')
        .setProperty(BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_LOCATION)
        .setUseOutbreakLocations(true)
        .setLocationChangedCallback((rowNo, locationInfo) => {
          // nothing to do ?
          if (
            !locationInfo ||
            !locationInfo.geoLocation ||
            typeof locationInfo.geoLocation.lat !== 'number' ||
            typeof locationInfo.geoLocation.lng !== 'number'
          ) {
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
                // finished
                return;
              }

              // find lat column
              const latColumnIndex: number = this.hotTableWrapper.sheetColumns.findIndex((column) => column.property === BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_GEOLOCATION_LAT);
              const lngColumnIndex: number = this.hotTableWrapper.sheetColumns.findIndex((column) => column.property === BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_GEOLOCATION_LNG);

              // change location lat & lng
              const sheetCore: Handsontable.default = (this.hotTableWrapper.sheetTable as any).hotInstance;
              sheetCore.setDataAtCell(
                rowNo,
                latColumnIndex,
                locationInfo.geoLocation.lat
              );
              sheetCore.setDataAtCell(
                rowNo,
                lngColumnIndex,
                locationInfo.geoLocation.lng
              );
            });
        })
        .setAsyncValidator((value, cellProperties: CellProperties, callback: (result: boolean) => void): void => {
          // location is required if any of the address field is filled
          if (value) {
            callback(true);
          } else {
            // check address fields
            return callback(
              !this.isAddressFilled(
                cellProperties.row,
                this._addressColumnIndexes.locationId
              )
            );
          }
        }),
      new TextSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_CITY')
        .setProperty(BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_CITY),
      new TextSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE')
        .setProperty(BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_POSTAL_CODE),
      new TextSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1')
        .setProperty(BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_ADDRESS_LINE1),
      new NumericSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LAT')
        .setProperty(BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_GEOLOCATION_LAT)
        .setAsyncValidator((value, cellProperties: CellProperties, callback: (result: boolean) => void): void => {
          if (
            value ||
            value === 0
          ) {
            callback(true);
          } else {
            // for now lng should always be the next one
            const sheetCore: Handsontable.default = (this.hotTableWrapper.sheetTable as any).hotInstance;
            const lat: number | string = sheetCore.getDataAtCell(cellProperties.row, cellProperties.col + 1);
            callback(!lat && lat !== 0);
          }
        }),
      new NumericSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LNG')
        .setProperty(BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_GEOLOCATION_LNG)
        .setAsyncValidator((value, cellProperties: CellProperties, callback: (result: boolean) => void): void => {
          if (
            value ||
            value === 0
          ) {
            callback(true);
          } else {
            // for now lat should always be the previous one
            const sheetCore: Handsontable.default = (this.hotTableWrapper.sheetTable as any).hotInstance;
            const lat: number | string = sheetCore.getDataAtCell(cellProperties.row, cellProperties.col - 1);
            callback(!lat && lat !== 0);
          }
        }),
      new DropdownSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_MANUAL_COORDINATES')
        .setProperty(BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_GEOLOCATION_ACCURATE)
        .setOptions(this.yesNoList$, this.i18nService),

      // Epidemiology
      new DateSheetColumn(
        null,
        moment())
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING')
        .setProperty('contactOfContact.dateOfReporting')
        .setRequired(),
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE')
        .setProperty('contactOfContact.isDateOfReportingApproximate')
        .setOptions(this.yesNoList$, this.i18nService),
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL')
        .setProperty('contactOfContact.riskLevel')
        .setOptions(this.riskLevelsList$, this.i18nService),
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_REASON')
        .setProperty('contactOfContact.riskReason'),

      // Relationship properties
      new DateSheetColumn(
        null,
        moment())
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_DATE_OF_FIRST_CONTACT')
        .setProperty('relationship.dateOfFirstContact'),
      new DateSheetColumn(
        null,
        moment())
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE')
        .setProperty('relationship.contactDate')
        .setRequired(),
      new DropdownSheetColumn()
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED')
        .setProperty('relationship.contactDateEstimated')
        .setOptions(this.yesNoList$, this.i18nService),
      new DropdownSheetColumn()
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL')
        .setProperty('relationship.certaintyLevelId')
        .setOptions(this.certaintyLevelOptions$, this.i18nService)
        .setRequired(),
      new DropdownSheetColumn()
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE')
        .setProperty('relationship.exposureTypeId')
        .setOptions(this.exposureTypeOptions$, this.i18nService),
      new DropdownSheetColumn()
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY')
        .setProperty('relationship.exposureFrequencyId')
        .setOptions(this.exposureFrequencyOptions$, this.i18nService),
      new DropdownSheetColumn()
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION')
        .setProperty('relationship.exposureDurationId')
        .setOptions(this.exposureDurationOptions$, this.i18nService),
      new DropdownSheetColumn()
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_RELATION')
        .setProperty('relationship.socialRelationshipTypeId')
        .setOptions(this.socialRelationshipOptions$, this.i18nService),
      new DropdownSheetColumn()
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER')
        .setProperty('relationship.clusterId')
        .setOptions(this.clusterList$, this.i18nService),
      new TextSheetColumn()
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP')
        .setProperty('relationship.socialRelationshipDetail'),
      new TextSheetColumn()
        .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_COMMENT')
        .setProperty('relationship.comment')
    ];

    // configure the context menu
    this.sheetContextMenu = {
      items: {
        row_above: {
          name: this.i18nService.instant('LNG_SHEET_CONTEXT_MENU_ROW_ABOVE')
        },
        row_below: {
          name: this.i18nService.instant('LNG_SHEET_CONTEXT_MENU_ROW_BELOW')
        },
        remove_row: {
          name: this.i18nService.instant('LNG_SHEET_CONTEXT_MENU_REMOVE_ROW')
        },
        cut: {
          name: this.i18nService.instant('LNG_SHEET_CONTEXT_MENU_CUT')
        },
        copy: {
          name: this.i18nService.instant('LNG_SHEET_CONTEXT_MENU_COPY')
        }
      }
    };

    // get address column indexes
    this._addressColumnIndexes = {
      date: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_DATE),
      emailAddress: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_EMAIL_ADDRESS),
      phoneNumber: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_PHONE_NUMBER),
      locationId: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_LOCATION),
      city: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_CITY),
      postalCode: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_POSTAL_CODE),
      addressLine1: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_ADDRESS_LINE1),
      geoLocationLat: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_GEOLOCATION_LAT),
      geoLocationLng: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_GEOLOCATION_LNG),
      geoLocationAccurate: this.sheetColumns.findIndex((column) => column.property === BulkCreateContactsOfContactsComponent.COLUMN_PROPERTY_GEOLOCATION_ACCURATE)
    };
  }

  /**
   * After changes
   */
  afterChange(event: IHotTableWrapperEvent) {
    // validate if only there are changes
    if (!event.typeSpecificData.changes) {
      return;
    }

    // check if the address fields were changed
    event.typeSpecificData.changes.forEach((cell: any) => {
      // cell[0] - row number, cell[1] - column index, cell[2] - old value, cell[3] - new value
      const columnIndex: number = cell[1];

      // check changed column
      if (Object.values(this._addressColumnIndexes).indexOf(columnIndex) > -1) {
        // address fields
        this.setAddressDate(
          event.sheetTable,
          cell
        );
      }
    });
  }

  /**
   * Sets "date" address field to current date if it's not set
   */
  private setAddressDate(
    sheetTable: HotTableComponent,
    cell: any[]
  ): void {
    // get cell info
    const rowNumber: number = cell[0];
    const columnIndex: number = cell[1];
    const newValue: string = cell[3];

    // return if the date was manually cleared
    if (this._manualClearedDateCells[rowNumber]) {
      return;
    }

    // check if "date" was changed
    if (columnIndex === this._addressColumnIndexes.date) {
      // save if date was manually cleared
      if (!newValue) {
        this._manualClearedDateCells[rowNumber] = true;
      }

      // return
      return;
    }

    // return if "date" field is filled
    const sheetCore: Handsontable.default = (sheetTable as any).hotInstance;
    if (
      sheetCore.getDataAtCell(
        rowNumber,
        this._addressColumnIndexes.date
      )
    ) {
      return;
    }

    // set "date" address field to current date if at least an address field is filled
    if (this.isAddressFilled(rowNumber)) {
      sheetCore.setDataAtCell(
        rowNumber,
        this._addressColumnIndexes.date,
        moment().format(Constants.DEFAULT_DATE_DISPLAY_FORMAT)
      );
    }
  }

  /**
   * Checks if any of the address field is filled
   *
   * @param rowNumber Row Number
   */
  private isAddressFilled(
    rowNumber: number,
    ignoredColumn: number = this._addressColumnIndexes.date
  ): boolean {
    // sheet core
    const sheetCore: Handsontable.default = (this.hotTableWrapper.sheetTable as any).hotInstance;

    // check fields
    const indexesFiltered: number[] = Object.values(this._addressColumnIndexes).filter((item) => item !== ignoredColumn);
    for (const column of Object.values(indexesFiltered)) {
      // get "date" column value
      const value: any = sheetCore.getDataAtCell(
        rowNumber,
        column
      );

      // break if any address field is filled
      if (value) {
        return true;
      }
    }

    // no address field filled
    return false;
  }

  /**
   * After changes
   */
  afterBecameDirty() {
    // no input to make dirty ?
    if (!this.inputForMakingFormDirty) {
      return;
    }

    // make form dirty
    this.inputForMakingFormDirty.control.markAsDirty();
  }

  /**
   * Retrieve information of related person
   */
  private retrieveRelatedPerson() {
    if (
      this.selectedOutbreak &&
      this.selectedOutbreak.id &&
      this.relatedEntityId
    ) {
      // retrieve related person information
      this.contactDataService
        .getContact(this.selectedOutbreak.id, this.relatedEntityId)
        .pipe(
          catchError((err) => {
            // show error message
            this.toastV2Service.error(err);

            // navigate to Cases/Events listing page
            this.redirectToContactListPage();

            return throwError(err);
          })
        )
        .subscribe((relatedEntityData: ContactModel) => {
          // keep person data
          this.relatedEntityData = relatedEntityData;
        });
    }
  }

  /**
   * Check that we have related Person Type and ID
   */
  private validateRelatedEntity() {
    if (this.relatedEntityId) {
      return true;
    }

    // related person data is wrong or missing
    this.toastV2Service.error('LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_WARNING_CONTACT_REQUIRED');

    // navigate to Contacts listing page
    this.redirectToContactListPage();

    return false;
  }

  /**
   * Redirect to Contacts list page
   */
  private redirectToContactListPage() {
    if (ContactModel.canList(this.authUser)) {
      this.router.navigate(['/contacts']);
    } else {
      this.router.navigate(['/']);
    }
  }

  /**
   * Create multiple Contacts of Contacts
   */
  addContactsOfContacts() {
    // make sure we have the component used to validate & retrieve data
    if (!this.hotTableWrapper) {
      return;
    }

    // validate sheet
    const loadingDialog = this.dialogV2Service.showLoadingDialog();
    this.errorMessages = [];
    this.hotTableWrapper
      .validateTable()
      .subscribe((response) => {
        // we can't continue if we have errors
        if (!response.isValid) {
          // map error messages if any?
          this.errorMessages = this.hotTableWrapper.getErrors(
            response,
            'LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_LABEL_ERROR_MSG'
          );

          // show error
          loadingDialog.close();
          this.toastV2Service.error('LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_WARNING_INVALID_FIELDS');
        } else {
          // collect data from table
          this.hotTableWrapper
            .getData()
            .subscribe((dataResponse: {
              data: any[],
              sheetCore: Handsontable.default
            }) => {
              // no data to save ?
              if (_.isEmpty(dataResponse.data)) {
                // show error
                loadingDialog.close();
                this.toastV2Service.error('LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_WARNING_NO_DATA');
              } else {
                // create contacts of contacts
                this.contactsOfContactsDataService
                  .bulkAddContactsOfContacts(
                    this.selectedOutbreak.id,
                    this.relatedEntityId,
                    dataResponse.data
                  )
                  .pipe(
                    catchError((err) => {
                      // close dialog
                      loadingDialog.close();

                      // mark success records
                      this.errorMessages = [];
                      if (dataResponse.sheetCore) {
                        // display partial success message
                        if (!_.isEmpty(_.get(err, 'details.success'))) {
                          this.errorMessages.push({
                            message: 'LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_LABEL_PARTIAL_ERROR_MSG'
                          });
                        }

                        // remove success records
                        // items should be ordered by recordNo
                        //  - so in this case if we reverse we can remove records from sheet without having to take in account that we removed other rows as well
                        (_.get(err, 'details.success') || []).reverse().forEach((successRecord) => {
                          // remove record that was added
                          if (_.isNumber(successRecord.recordNo)) {
                            // remove row
                            dataResponse.sheetCore.alter(
                              'remove_row',
                              successRecord.recordNo,
                              1
                            );

                            // substract row numbers
                            _.each(
                              _.get(err, 'details.failed'),
                              (item) => {
                                if (!_.isNumber(item.recordNo)) {
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
                      this.toastV2Service.translateErrors(errors)
                        .subscribe((translatedErrors) => {
                          // transform errors
                          (translatedErrors || []).forEach((translatedError) => {
                            // determine row number
                            let row: number = _.get(translatedError, 'echo.recordNo', null);
                            if (_.isNumber(row)) {
                              row++;
                            }

                            // add to error list
                            this.errorMessages.push({
                              message: 'LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_LABEL_API_ERROR_MSG',
                              data: {
                                row: row,
                                err: translatedError.message
                              }
                            });
                          });
                        });

                      // display error
                      this.toastV2Service.error(err);
                      return throwError(err);
                    })
                  )
                  .subscribe(() => {
                    this.toastV2Service.success('LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_ACTION_CREATE_CONTACTS_SUCCESS_MESSAGE');

                    // navigate to listing page
                    this.disableDirtyConfirm();
                    loadingDialog.close();
                    if (ContactOfContactModel.canList(this.authUser)) {
                      this.router.navigate(['/contacts-of-contacts']);
                    } else {
                      this.router.navigate(['/']);
                    }
                  });
              }
            });
        }
      });
  }

}
