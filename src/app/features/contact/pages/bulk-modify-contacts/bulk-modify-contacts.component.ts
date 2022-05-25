import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable, throwError } from 'rxjs';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import * as _ from 'lodash';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { AbstractSheetColumn, LocationSheetColumn, DateSheetColumn, DropdownSheetColumn, IntegerSheetColumn, TextSheetColumn } from '../../../../core/models/sheet/sheet.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { ContactModel } from '../../../../core/models/contact.model';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { catchError, map, share } from 'rxjs/operators';
import { moment } from '../../../../core/helperClasses/x-moment';
import { HotTableWrapperComponent } from '../../../../shared/components/hot-table-wrapper/hot-table-wrapper.component';
import { Constants } from '../../../../core/models/constants';
import { Subscription } from 'rxjs/internal/Subscription';
import { SheetCellType } from '../../../../core/models/sheet/sheet-cell-type';
import * as Handsontable from 'handsontable';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { TeamModel } from '../../../../core/models/team.model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { IV2ActionIconLabel, V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';

@Component({
  selector: 'app-bulk-modify-contacts',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './bulk-modify-contacts.component.html',
  styleUrls: ['./bulk-modify-contacts.component.scss']
})
export class BulkModifyContactsComponent extends ConfirmOnFormChanges implements OnInit, OnDestroy {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  @ViewChild('inputForMakingFormDirty', { static: true }) inputForMakingFormDirty;
  @ViewChild('hotTableWrapper', { static: true }) hotTableWrapper: HotTableWrapperComponent;

  // selected outbreak
  selectedOutbreak: OutbreakModel;

  // options for dropdown cells
  genderList$: Observable<LabelValuePair[]>;
  occupationsList$: Observable<LabelValuePair[]>;
  riskLevelsList$: Observable<LabelValuePair[]>;
  finalFollowUpStatus$: Observable<LabelValuePair[]>;

  // teams
  teamList$: Observable<TeamModel[]>;
  teamIdNameMap: {
    [id: string]: string
  };

  // sheet widget configuration
  sheetContextMenu = {};
  sheetColumns: AbstractSheetColumn[] = [];

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
  extraContactData: {
    id: string,
    addresses: AddressModel[],
    followUpTeamId: string
  }[];

  // subscribers
  outbreakSubscriber: Subscription;
  queryParamsSubscriber: Subscription;

  // action
  actionButton: IV2ActionIconLabel;

  // authenticated user details
  authUser: UserModel;

  // contacts
  contactIds: string[];

  /**
   * Constructor
   */
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private contactDataService: ContactDataService,
    private outbreakDataService: OutbreakDataService,
    private toastV2Service: ToastV2Service,
    private referenceDataDataService: ReferenceDataDataService,
    private i18nService: I18nService,
    private dialogService: DialogService,
    private authDataService: AuthDataService,
    private teamDataService: TeamDataService
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
    this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER).pipe(share());
    this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION).pipe(share());
    this.riskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL).pipe(share());
    this.finalFollowUpStatus$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_FINAL_FOLLOW_UP_STATUS).pipe(share());

    // retrieve teams
    if (TeamModel.canList(this.authUser)) {
      this.teamList$ = this.teamDataService.getTeamsListReduced().pipe(share());
      this.teamList$.subscribe((teams) => {
        // map teams
        this.teamIdNameMap = {};
        teams.forEach((team) => {
          this.teamIdNameMap[team.id] = team.name;
        });

        // retrieve contacts information
        // we should have contacts ids here it should load queryParams before receiving answer from api
        setTimeout(() => {
          this.retrieveContacts();
        });
      });
    }

    // init table columns
    this.configureSheetWidget();

    // retrieve query params
    this.queryParamsSubscriber = this.route.queryParams
      .subscribe((params: { contactIds }) => {
        this.contactIds = params.contactIds ? JSON.parse(params.contactIds) : [];
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

        // retrieve contacts information
        // we should have contacts ids here it should load queryParams before receiving answer from api
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
          this.modifyContacts();
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
      label: 'LNG_PAGE_BULK_MODIFY_CONTACTS_TITLE',
      action: null
    });
  }

  /**
   * Retrieve contacts
   */
  private retrieveContacts() {
    // no contact ids ?
    if (
      !this.contactIds ||
      this.contactIds.length < 1
    ) {
      if (ContactModel.canList(this.authUser)) {
        this.router.navigate(['/contacts']);
      } else {
        this.router.navigate(['/']);
      }
    }

    // stop multiple requests
    // outbreak not retrieved ?
    if (
      this.loadingData ||
      !this.selectedOutbreak ||
      !this.selectedOutbreak.id || (
        TeamModel.canList(this.authUser) &&
        this.teamIdNameMap === undefined
      )
    ) {
      return;
    }

    // create search query builder to retrieve our contacts
    const qb = new RequestQueryBuilder();
    qb.filter.bySelect(
      'id',
      this.contactIds,
      true,
      null
    );

    // retrieve contacts
    const loadingDialog = this.dialogService.showLoadingDialog();
    this.loadingData = true;
    this.contactDataService
      .getContactsList(this.selectedOutbreak.id, qb)
      .pipe(catchError((err) => {
        loadingDialog.close();
        this.toastV2Service.error(err);
        return throwError(err);
      }))
      .subscribe((contactModels) => {
        // construct hot table data
        this.extraContactData = [];
        this.data = (contactModels as ContactModel[] || []).map((contact: ContactModel) => {
          // determine contact data
          const contactData = [];
          this.sheetColumns.forEach((column: AbstractSheetColumn) => {
            // retrieve property
            const property = column.property;

            // retrieve value
            let value;
            let addressModel: AddressModel;
            switch (property) {
              case 'addresses.phoneNumber':
                addressModel = AddressModel.getCurrentAddress(contact.addresses);
                value = addressModel ? addressModel.phoneNumber : null;
                break;
              case 'addresses.city':
                addressModel = AddressModel.getCurrentAddress(contact.addresses);
                value = addressModel ? addressModel.city : null;
                break;
              case 'addresses.postalCode':
                addressModel = AddressModel.getCurrentAddress(contact.addresses);
                value = addressModel ? addressModel.postalCode : null;
                break;
              case 'addresses.locationId':
                addressModel = AddressModel.getCurrentAddress(contact.addresses);
                value = addressModel ? addressModel.locationId : null;
                break;
              case 'addresses.addressLine1':
                addressModel = AddressModel.getCurrentAddress(contact.addresses);
                value = addressModel ? addressModel.addressLine1 : null;
                break;
              default:
                value = _.get(contact, property);
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
                  value = value ? this.i18nService.instant(value) : null;
                } else {
                  switch (column.property) {
                    case 'followUpTeamId':
                      value = value && this.teamIdNameMap[value] ? this.teamIdNameMap[value] : null;
                      break;
                  }
                }
                break;
            }

            // finished
            contactData.push(value !== undefined ? value : null);
          });

          // return spreadsheet data
          this.extraContactData.push({
            id: contact.id,
            addresses: contact.addresses,
            followUpTeamId: contact.followUpTeamId
          });

          // finished
          return contactData;
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
        .setTitle('LNG_CONTACT_FIELD_LABEL_FIRST_NAME')
        .setProperty('firstName')
        .setRequired(),
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_LAST_NAME')
        .setProperty('lastName'),
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_GENDER')
        .setProperty('gender')
        .setOptions(this.genderList$, this.i18nService),
      new DateSheetColumn(
        null,
        moment())
        .setTitle('LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING')
        .setProperty('dateOfReporting')
        .setRequired(),
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_OCCUPATION')
        .setProperty('occupation')
        .setOptions(this.occupationsList$, this.i18nService),
      new IntegerSheetColumn(
        0,
        Constants.DEFAULT_AGE_MAX_YEARS)
        .setTitle('LNG_CONTACT_FIELD_LABEL_AGE_YEARS')
        .setProperty('age.years'),
      new IntegerSheetColumn(
        0,
        11)
        .setTitle('LNG_CONTACT_FIELD_LABEL_AGE_MONTHS')
        .setProperty('age.months'),
      new DateSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_DATE_OF_BIRTH')
        .setProperty('dob'),
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_RISK_LEVEL')
        .setProperty('riskLevel')
        .setOptions(this.riskLevelsList$, this.i18nService),
      new TextSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_RISK_REASON')
        .setProperty('riskReason'),

      // Contact Address(es)
      new LocationSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_LOCATION')
        .setProperty('addresses.locationId')
        .setUseOutbreakLocations(true),
      new TextSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_CITY')
        .setProperty('addresses.city'),
      new TextSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1')
        .setProperty('addresses.addressLine1'),
      new TextSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE')
        .setProperty('addresses.postalCode'),
      new TextSheetColumn()
        .setTitle('LNG_ADDRESS_FIELD_LABEL_PHONE_NUMBER')
        .setProperty('addresses.phoneNumber'),

      // Contact Document(s)
      // Can't edit since they are multiple
      // or we could implement something custom..like location to edit a list of items

      // only field available for update contact
      new DropdownSheetColumn()
        .setTitle('LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS')
        .setProperty('followUp.status')
        .setOptions(this.finalFollowUpStatus$, this.i18nService)
    ];

    // add assigned team if we have permissions to do that
    if (TeamModel.canList(this.authUser)) {
      this.sheetColumns.push(
        new DropdownSheetColumn()
          .setTitle('LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_TEAM_ID')
          .setProperty('followUpTeamId')
          .setOptions(
            this.teamList$.pipe(
              map((teams: TeamModel[]) => {
                return teams.map((team) => {
                  return new LabelValuePair(
                    team.name,
                    team.id
                  );
                });
              }),
              share()
            ),
            this.i18nService,
            false
          )
      );
    }

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
  modifyContacts() {
    // make sure we have the component used to validate & retrieve data
    if (!this.hotTableWrapper) {
      return;
    }

    // validate sheet
    const loadingDialog = this.dialogService.showLoadingDialog();
    this.errorMessages = [];
    this.hotTableWrapper
      .validateTable()
      .subscribe((response) => {
        // we can't continue if we have errors
        if (!response.isValid) {
          // map error messages if any?
          this.errorMessages = this.hotTableWrapper.getErrors(
            response,
            'LNG_PAGE_BULK_MODIFY_CONTACTS_LABEL_ERROR_MSG'
          );

          // show error
          loadingDialog.close();
          this.toastV2Service.error('LNG_PAGE_BULK_MODIFY_CONTACTS_WARNING_INVALID_FIELDS');
        } else {
          // collect data from table
          this.hotTableWrapper.getData()
            .subscribe((dataResponse: {
              data: any[],
              sheetCore: Handsontable.default
            }) => {
              // add id
              (dataResponse.data || []).forEach((contactData, index: number) => {
                // set data
                contactData.id = this.extraContactData[index].id;

                // must reset follow-up team assign ?
                if (
                  TeamModel.canList(this.authUser) &&
                  this.extraContactData[index].followUpTeamId &&
                  !contactData.followUpTeamId
                ) {
                  contactData.followUpTeamId = null;
                }

                // create / modify address phone number
                if (contactData.addresses) {
                  // find address
                  let address: AddressModel = AddressModel.getCurrentAddress(this.extraContactData[index].addresses);

                  // create a new one if there isn't a current address
                  if (!address) {
                    // create the new address
                    address = new AddressModel({
                      typeId: AddressType.CURRENT_ADDRESS
                    });

                    // since it is a new address we need to add it to the contact model
                    if (_.isArray(this.extraContactData[index].addresses)) {
                      this.extraContactData[index].addresses.push(address);
                    } else {
                      this.extraContactData[index].addresses = [address];
                    }
                  }

                  // replace phone number
                  if (contactData.addresses.phoneNumber !== undefined) {
                    address.phoneNumber = contactData.addresses.phoneNumber;
                  } else {
                    address.phoneNumber = null;
                  }

                  // replace city
                  if (contactData.addresses.city !== undefined) {
                    address.city = contactData.addresses.city;
                  } else {
                    address.city = null;
                  }

                  // replace postal code
                  if (contactData.addresses.postalCode !== undefined) {
                    address.postalCode = contactData.addresses.postalCode;
                  } else {
                    address.postalCode = null;
                  }

                  // replace locationId
                  if (contactData.addresses.locationId !== undefined) {
                    address.locationId = contactData.addresses.locationId;
                  } else {
                    address.locationId = null;
                  }

                  // replace address1
                  if (contactData.addresses.addressLine1 !== undefined) {
                    address.addressLine1 = contactData.addresses.addressLine1;
                  } else {
                    address.addressLine1 = null;
                  }

                  // replace with correct data
                  contactData.addresses = this.extraContactData[index].addresses;
                } else {
                  // We should delete current address in this case
                  // but for now this isn't a good idea since we need to take in consideration that contact could have multiple addresses, and at least one should be current address
                  // so either we delete all addresses, or show error that user can't remove current location since it has other locations as well..
                  // #TBD
                }
              });

              // modify contacts
              this.contactDataService
                .bulkModifyContacts(
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
                  this.toastV2Service.success('LNG_PAGE_BULK_MODIFY_CONTACTS_ACTION_MODIFY_CONTACTS_SUCCESS_MESSAGE');

                  // navigate to listing page
                  this.disableDirtyConfirm();
                  loadingDialog.close();
                  if (ContactModel.canList(this.authUser)) {
                    this.router.navigate(['/contacts']);
                  } else {
                    this.router.navigate(['/']);
                  }
                });
            });
        }
      });
  }
}
