import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { HotTableWrapperComponent } from '../../../../shared/components/hot-table-wrapper/hot-table-wrapper.component';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable, of, Subscription, throwError } from 'rxjs';
import { AbstractSheetColumn, DateSheetColumn, DropdownSheetColumn, IntegerSheetColumn, LocationSheetColumn, NumericSheetColumn, TextSheetColumn } from '../../../../core/models/sheet/sheet.model';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { UserModel } from '../../../../core/models/user.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { catchError, share } from 'rxjs/operators';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import * as _ from 'lodash';
import { SheetCellType } from '../../../../core/models/sheet/sheet-cell-type';
import { moment } from '../../../../core/helperClasses/x-moment';
import { Constants } from '../../../../core/models/constants';
import * as Handsontable from 'handsontable';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IV2ActionIconLabel, V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { CellProperties } from 'handsontable/settings';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IAddressColumnIndex } from '../../../../core/models/address.interface';

@Component({
  selector: 'app-bulk-modify-contacts-of-contacts',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './bulk-modify-contacts-of-contacts.component.html',
  styleUrls: ['./bulk-modify-contacts-of-contacts.component.scss']
})
export class BulkModifyContactsOfContactsComponent extends ConfirmOnFormChanges implements OnInit, OnDestroy {
  // constants
  private static readonly COLUMN_PROPERTY_PREGNANCY_STATUS: string = 'pregnancyStatus';
  private static readonly COLUMN_PROPERTY_DATE: string = 'addresses.date';
  private static readonly COLUMN_PROPERTY_EMAIL_ADDRESS: string = 'addresses.emailAddress';
  private static readonly COLUMN_PROPERTY_PHONE_NUMBER: string = 'addresses.phoneNumber';
  private static readonly COLUMN_PROPERTY_LOCATION: string = 'addresses.locationId';
  private static readonly COLUMN_PROPERTY_CITY: string = 'addresses.city';
  private static readonly COLUMN_PROPERTY_POSTAL_CODE: string = 'addresses.postalCode';
  private static readonly COLUMN_PROPERTY_ADDRESS_LINE1: string = 'addresses.addressLine1';
  private static readonly COLUMN_PROPERTY_GEOLOCATION_LAT: string = 'addresses.geoLocation.lat';
  private static readonly COLUMN_PROPERTY_GEOLOCATION_LNG: string = 'addresses.geoLocation.lng';
  private static readonly COLUMN_PROPERTY_GEOLOCATION_ACCURATE: string = 'addresses.geoLocationAccurate';

  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  @ViewChild('inputForMakingFormDirty', { static: true }) inputForMakingFormDirty;
  @ViewChild('hotTableWrapper', { static: true }) hotTableWrapper: HotTableWrapperComponent;

  // selected outbreak
  selectedOutbreak: OutbreakModel;

  // options for dropdown cells
  genderList$: Observable<ILabelValuePairModel[]>;
  occupationsList$: Observable<ILabelValuePairModel[]>;
  riskLevelsList$: Observable<ILabelValuePairModel[]>;
  yesNoList$: Observable<ILabelValuePairModel[]>;
  pregnancyStatusList$: Observable<ILabelValuePairModel[]>;

  // sheet widget configuration
  sheetContextMenu = {};
  sheetColumns: AbstractSheetColumn[] = [];

  // address column indexes
  private _addressColumnIndexes: IAddressColumnIndex;

  // error messages
  errorMessages: {
    message: string,
    data: {
      row: number,
      columns: string
    }
  }[] = [];

  loadingData: boolean = false;
  data: any[][] = [];
  extraContactOfContactData: {
    id: string,
    addresses: AddressModel[],
  }[];

  // subscribers
  outbreakSubscriber: Subscription;
  queryParamsSubscriber: Subscription;

  // action
  actionButton: IV2ActionIconLabel;

  // authenticated user details
  authUser: UserModel;

  // ids of contacts of contacts we want to modify
  contactOfContactIds: string[];

  /**
   * Constructor
   */
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
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
    this.yesNoList$ = of((this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());
    this.pregnancyStatusList$ = of((this.activatedRoute.snapshot.data.pregnancyStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options).pipe(share());

    // init table columns
    this.configureSheetWidget();

    // retrieve query params
    this.queryParamsSubscriber = this.activatedRoute.queryParams
      .subscribe((params: { contactOfContactIds }) => {
        this.contactOfContactIds = params.contactOfContactIds ? JSON.parse(params.contactOfContactIds) : [];
      });

    // get selected outbreak
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreak()
      .pipe(
        catchError((err) => {
          // show error message
          this.toastV2Service.error(err);
          return throwError(err);
        })
      )
      .subscribe((selectedOutbreak: OutbreakModel) => {
        // selected outbreak
        this.selectedOutbreak = selectedOutbreak;

        // retrieve contacts of contacts information
        // we should have contact of contact ids here it should load queryParams before receiving answer from api
        setTimeout(() => {
          this.retrieveContacts();
        });
      });

    // action button
    this.actionButton = {
      type: V2ActionType.ICON_LABEL,
      icon: '',
      label: 'LNG_COMMON_BUTTON_SAVE',
      action: {
        click: () => {
          this.modifyContactsOfContacts();
        }
      }
    };

    // initialize page breadcrumbs
    this.initializeBreadcrumbs();
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

    // unsubscribe
    if (this.queryParamsSubscriber) {
      this.queryParamsSubscriber.unsubscribe();
      this.queryParamsSubscriber = null;
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

    // contacts of contacts list page
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
      label: 'LNG_PAGE_BULK_MODIFY_CONTACTS_OF_CONTACTS_TITLE',
      action: null
    });
  }

  /**
   * Retrieve contacts
   */
  private retrieveContacts() {
    // no contact of contact ids ?
    if (
      !this.contactOfContactIds ||
      this.contactOfContactIds.length < 1
    ) {
      if (ContactOfContactModel.canList(this.authUser)) {
        this.router.navigate(['/contacts-of-contacts']);
      } else {
        this.router.navigate(['/']);
      }
    }

    // stop multiple requests
    // outbreak not retrieved ?
    if (
      this.loadingData ||
      !this.selectedOutbreak ||
      !this.selectedOutbreak.id
    ) {
      return;
    }

    // create search query builder to retrieve our contacts
    const qb = new RequestQueryBuilder();
    qb.filter.bySelect(
      'id',
      this.contactOfContactIds,
      true,
      null
    );

    // retrieve contacts of contacts
    const loadingDialog = this.dialogV2Service.showLoadingDialog();
    this.loadingData = true;
    this.contactsOfContactsDataService
      .getContactsOfContactsList(this.selectedOutbreak.id, qb)
      .pipe(catchError((err) => {
        loadingDialog.close();
        this.toastV2Service.error(err);
        return throwError(err);
      }))
      .subscribe((contactOfContactModels) => {
        // construct hot table data
        this.extraContactOfContactData = [];
        this.data = (contactOfContactModels as ContactOfContactModel[] || []).map((contactOfContact: ContactOfContactModel) => {
          // determine contact of contact data
          const contactOfContactData = [];
          this.sheetColumns.forEach((column: AbstractSheetColumn) => {
            // retrieve property
            const property = column.property;

            // retrieve value
            let value;
            let addressModel: AddressModel;
            switch (property) {
              case BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_DATE:
                addressModel = AddressModel.getCurrentAddress(contactOfContact.addresses);
                value = addressModel ? addressModel.date : null;
                break;
              case BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_EMAIL_ADDRESS:
                addressModel = AddressModel.getCurrentAddress(contactOfContact.addresses);
                value = addressModel ? addressModel.emailAddress : null;
                break;
              case BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_PHONE_NUMBER:
                addressModel = AddressModel.getCurrentAddress(contactOfContact.addresses);
                value = addressModel ? addressModel.phoneNumber : null;
                break;
              case BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_LOCATION:
                addressModel = AddressModel.getCurrentAddress(contactOfContact.addresses);
                value = addressModel ? addressModel.locationId : null;
                break;
              case BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_CITY:
                addressModel = AddressModel.getCurrentAddress(contactOfContact.addresses);
                value = addressModel ? addressModel.city : null;
                break;
              case BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_POSTAL_CODE:
                addressModel = AddressModel.getCurrentAddress(contactOfContact.addresses);
                value = addressModel ? addressModel.postalCode : null;
                break;
              case BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_ADDRESS_LINE1:
                addressModel = AddressModel.getCurrentAddress(contactOfContact.addresses);
                value = addressModel ? addressModel.addressLine1 : null;
                break;
              case BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_GEOLOCATION_LAT:
                addressModel = AddressModel.getCurrentAddress(contactOfContact.addresses);
                value = addressModel ? addressModel.geoLocation?.lat : null;
                break;
              case BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_GEOLOCATION_LNG:
                addressModel = AddressModel.getCurrentAddress(contactOfContact.addresses);
                value = addressModel ? addressModel.geoLocation?.lng : null;
                break;
              case BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_GEOLOCATION_ACCURATE:
                addressModel = AddressModel.getCurrentAddress(contactOfContact.addresses);
                value = addressModel ? addressModel.geoLocationAccurate : null;
                break;
              default:
                value = _.get(contactOfContact, property);
            }

            // format value
            switch (column.type) {
              case SheetCellType.NUMERIC:
                value = value ? parseFloat(value) : null;
                break;
              case SheetCellType.DATE:
                value = value ? moment(value).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) : null;
                break;
              case SheetCellType.TEXT:
                // NOTHING
                break;
              case SheetCellType.DROPDOWN:
                if ((column as DropdownSheetColumn).idTranslatesToLabel) {
                  value = (typeof value === 'boolean') ?
                    value ?
                      this.i18nService.instant( 'LNG_COMMON_LABEL_YES') :
                      this.i18nService.instant('LNG_COMMON_LABEL_NO') :
                    value ?
                      this.i18nService.instant(value) :
                      null;
                }
                break;
            }

            // finished
            contactOfContactData.push(value !== undefined ? value : null);
          });

          // return spreadsheet data
          this.extraContactOfContactData.push({
            id: contactOfContact.id,
            addresses: contactOfContact.addresses
          });

          // finished
          return contactOfContactData;
        });

        // hide loading
        loadingDialog.close();
      });
  }

  /**
   * Configure 'Handsontable'
   */
  private configureSheetWidget() {
    // configure columns
    this.sheetColumns = [
      // Contact properties
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME')
        .setProperty('firstName')
        .setRequired(),
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_MIDDLE_NAME')
        .setProperty('middleName'),
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME')
        .setProperty('lastName'),
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER')
        .setProperty('gender')
        .setOptions(this.genderList$, this.i18nService)
        .setAsyncValidator((value: string, cellProperties: CellProperties, callback: (result: boolean) => void): void => {
          // if gender is male reset pregnancy status value and make the cell readonly
          if (value) {
            // find pregnancy status column
            const sheetCore: Handsontable.default = (this.hotTableWrapper.sheetTable as any).hotInstance;
            const pregnancyStatusColumnIndex: number = this.hotTableWrapper.sheetColumns.findIndex((column) => column.property === BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_PREGNANCY_STATUS);

            if (value === this.i18nService.instant(Constants.GENDER_MALE)) {
              // reset pregnancy status value
              sheetCore.setDataAtCell(
                cellProperties.row,
                pregnancyStatusColumnIndex,
                null
              );
            }

            // change pregnancy status cell state read only/editable
            sheetCore.setCellMeta(cellProperties.row, pregnancyStatusColumnIndex, 'readOnly', value === this.i18nService.instant(Constants.GENDER_MALE));
          }

          // return always true to pass the validation (since pregnancy value it was cleared or gender is not male)
          callback(true);
        }),
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PREGNANCY_STATUS')
        .setProperty(BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_PREGNANCY_STATUS)
        .setOptions(this.pregnancyStatusList$, this.i18nService),
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION')
        .setProperty('occupation')
        .setOptions(this.occupationsList$, this.i18nService),
      new IntegerSheetColumn(
        0,
        Constants.DEFAULT_AGE_MAX_YEARS)
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE_YEARS')
        .setProperty('age.years'),
      new IntegerSheetColumn(
        0,
        11)
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE_MONTHS')
        .setProperty('age.months'),
      new DateSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_BIRTH')
        .setProperty('dob'),

      // Contact Document(s)
      // Can't edit since they are multiple
      // or we could implement something custom..like location to edit a list of items

      // Contact Address(es)
      new DateSheetColumn()
        .setTitle('LNG_PAGE_BULK_MODIFY_CONTACTS_OF_CONTACTS_ADDRESS_DATE')
        .setProperty(BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_DATE),
      new TextSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_EMAIL_ADDRESS')
        .setProperty(BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_EMAIL_ADDRESS)
        .setAsyncValidator((value: string, _cellProperties: CellProperties, callback: (result: boolean) => void): void => {
          // validate if only we have value
          if (_.isEmpty(value)) {
            callback(true);
          } else {
            // validate email using regex
            callback(Constants.REGEX_EMAIL_VALIDATOR.test(value));
          }
        }),
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PHONE_NUMBER')
        .setProperty(BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_PHONE_NUMBER),
      new LocationSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_LOCATION')
        .setProperty(BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_LOCATION)
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
              const latColumnIndex: number = this.hotTableWrapper.sheetColumns.findIndex((column) => column.property === BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_GEOLOCATION_LAT);
              const lngColumnIndex: number = this.hotTableWrapper.sheetColumns.findIndex((column) => column.property === BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_GEOLOCATION_LNG);

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
            return callback(!this.isAddressFilled(cellProperties.row));
          }
        }),
      new TextSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_CITY')
        .setProperty(BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_CITY),
      new TextSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE')
        .setProperty(BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_POSTAL_CODE),
      new TextSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1')
        .setProperty(BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_ADDRESS_LINE1),
      new NumericSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LAT')
        .setProperty(BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_GEOLOCATION_LAT)
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
        .setProperty(BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_GEOLOCATION_LNG)
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
        .setProperty(BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_GEOLOCATION_ACCURATE)
        .setOptions(this.yesNoList$, this.i18nService),

      // Epidemiology
      new DateSheetColumn(
        null,
        moment())
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING')
        .setProperty('dateOfReporting')
        .setRequired(),
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE')
        .setProperty('isDateOfReportingApproximate')
        .setOptions(this.yesNoList$, this.i18nService),
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL')
        .setProperty('riskLevel')
        .setOptions(this.riskLevelsList$, this.i18nService),
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_REASON')
        .setProperty('riskReason')
    ];

    // configure the context menu
    this.sheetContextMenu = {
      items: {
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
      date: this.sheetColumns.findIndex((column) => column.property === BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_DATE),
      emailAddress: this.sheetColumns.findIndex((column) => column.property === BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_EMAIL_ADDRESS),
      phoneNumber: this.sheetColumns.findIndex((column) => column.property === BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_PHONE_NUMBER),
      locationId: this.sheetColumns.findIndex((column) => column.property === BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_LOCATION),
      city: this.sheetColumns.findIndex((column) => column.property === BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_CITY),
      postalCode: this.sheetColumns.findIndex((column) => column.property === BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_POSTAL_CODE),
      addressLine1: this.sheetColumns.findIndex((column) => column.property === BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_ADDRESS_LINE1),
      geoLocationLat: this.sheetColumns.findIndex((column) => column.property === BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_GEOLOCATION_LAT),
      geoLocationLng: this.sheetColumns.findIndex((column) => column.property === BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_GEOLOCATION_LNG),
      geoLocationAccurate: this.sheetColumns.findIndex((column) => column.property === BulkModifyContactsOfContactsComponent.COLUMN_PROPERTY_GEOLOCATION_ACCURATE)
    };
  }

  /**
   * Checks if any of the address field is filled
   *
   * @param rowNumber Row Number
   */
  private isAddressFilled(
    rowNumber: number
  ): boolean {
    // sheet core
    const sheetCore: Handsontable.default = (this.hotTableWrapper.sheetTable as any).hotInstance;

    // check fields
    const indexesFiltered: number[] = Object.values(this._addressColumnIndexes).filter((item) => item !== this._addressColumnIndexes.locationId);
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
   * Modify Contacts
   */
  modifyContactsOfContacts() {
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
            'LNG_PAGE_BULK_MODIFY_CONTACTS_OF_CONTACTS_LABEL_ERROR_MSG'
          );

          // show error
          loadingDialog.close();
          this.toastV2Service.error('LNG_PAGE_BULK_MODIFY_CONTACTS_OF_CONTACTS_WARNING_INVALID_FIELDS');
        } else {
          // collect data from table
          this.hotTableWrapper.getData()
            .subscribe((dataResponse: {
              data: any[],
              sheetCore: Handsontable.default
            }) => {
              // add id
              (dataResponse.data || []).forEach((contactOfContactData, index: number) => {
                // set data
                contactOfContactData.id = this.extraContactOfContactData[index].id;

                // create / modify address fields
                if (contactOfContactData.addresses) {
                  // find address
                  let address: AddressModel = AddressModel.getCurrentAddress(this.extraContactOfContactData[index].addresses);

                  // create a new one if there isn't a current address
                  if (!address) {
                    // create the new address
                    address = new AddressModel({
                      typeId: AddressType.CURRENT_ADDRESS
                    });

                    // since it is a new address we need to add it to the contact of contact model
                    if (_.isArray(this.extraContactOfContactData[index].addresses)) {
                      this.extraContactOfContactData[index].addresses.push(address);
                    } else {
                      this.extraContactOfContactData[index].addresses = [address];
                    }
                  }

                  // replace address date
                  if (contactOfContactData.addresses.date !== undefined) {
                    address.date = contactOfContactData.addresses.date;
                  } else {
                    address.date = null;
                  }

                  // replace email address
                  if (contactOfContactData.addresses.emailAddress !== undefined) {
                    address.emailAddress = contactOfContactData.addresses.emailAddress;
                  } else {
                    address.emailAddress = null;
                  }

                  // replace phone number
                  if (contactOfContactData.addresses.phoneNumber !== undefined) {
                    address.phoneNumber = contactOfContactData.addresses.phoneNumber;
                  } else {
                    address.phoneNumber = null;
                  }

                  // replace locationId
                  if (contactOfContactData.addresses.locationId !== undefined) {
                    address.locationId = contactOfContactData.addresses.locationId;
                  } else {
                    address.locationId = null;
                  }

                  // replace city
                  if (contactOfContactData.addresses.city !== undefined) {
                    address.city = contactOfContactData.addresses.city;
                  } else {
                    address.city = null;
                  }

                  // replace postal code
                  if (contactOfContactData.addresses.postalCode !== undefined) {
                    address.postalCode = contactOfContactData.addresses.postalCode;
                  } else {
                    address.postalCode = null;
                  }

                  // replace address1
                  if (contactOfContactData.addresses.addressLine1 !== undefined) {
                    address.addressLine1 = contactOfContactData.addresses.addressLine1;
                  } else {
                    address.addressLine1 = null;
                  }

                  // replace geoLocation.lat
                  if (contactOfContactData.addresses.geoLocation?.lat !== undefined) {
                    address.geoLocation.lat = contactOfContactData.addresses.geoLocation?.lat;
                  } else {
                    address.geoLocation.lat = null;
                  }

                  // replace geolocation.lng
                  if (contactOfContactData.addresses.geoLocation?.lng !== undefined) {
                    address.geoLocation.lng = contactOfContactData.addresses.geoLocation?.lng;
                  } else {
                    address.geoLocation.lng = null;
                  }

                  // replace geolocation accurate
                  if (contactOfContactData.addresses.geoLocationAccurate !== undefined) {
                    address.geoLocationAccurate = contactOfContactData.addresses.geoLocationAccurate;
                  } else {
                    address.geoLocationAccurate = null;
                  }

                  // replace with correct data
                  contactOfContactData.addresses = this.extraContactOfContactData[index].addresses;
                } else {
                  // We should delete current address in this case
                  // but for now this isn't a good idea since we need to take in consideration that contact could have multiple addresses, and at least one should be current address
                  // so either we delete all addresses, or show error that user can't remove current location since it has other locations as well..
                  // #TBD
                }
              });

              // modify contacts
              this.contactsOfContactsDataService
                .bulkModifyContactsOfContacts(
                  this.selectedOutbreak.id,
                  dataResponse.data
                )
                .pipe(
                  catchError((err) => {
                    loadingDialog.close();
                    this.toastV2Service.error(err);
                    return throwError(err);
                  })
                )
                .subscribe(() => {
                  this.toastV2Service.success('LNG_PAGE_BULK_MODIFY_CONTACTS_OF_CONTACTS_ACTION_MODIFY_CONTACTS_SUCCESS_MESSAGE');

                  // navigate to listing page
                  this.disableDirtyConfirm();
                  loadingDialog.close();
                  if (ContactOfContactModel.canList(this.authUser)) {
                    this.router.navigate(['/contacts-of-contacts']);
                  } else {
                    this.router.navigate(['/']);
                  }
                });
            });
        }
      });
  }
}
