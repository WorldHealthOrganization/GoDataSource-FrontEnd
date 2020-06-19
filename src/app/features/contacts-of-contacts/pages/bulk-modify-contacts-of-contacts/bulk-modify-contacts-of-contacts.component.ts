import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { HotTableWrapperComponent } from '../../../../shared/components/hot-table-wrapper/hot-table-wrapper.component';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable, Subscription, throwError } from 'rxjs';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { AbstractSheetColumn, DateSheetColumn, DropdownSheetColumn, IntegerSheetColumn, LocationSheetColumn, TextSheetColumn } from '../../../../core/models/sheet/sheet.model';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { UserModel } from '../../../../core/models/user.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { catchError, map, share } from 'rxjs/operators';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import * as _ from 'lodash';
import { SheetCellType } from '../../../../core/models/sheet/sheet-cell-type';
import { moment } from '../../../../core/helperClasses/x-moment';
import { Constants } from '../../../../core/models/constants';
import * as Handsontable from 'handsontable';

@Component({
    selector: 'app-bulk-modify-contacts-of-contacts',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './bulk-modify-contacts-of-contacts.component.html',
    styleUrls: ['./bulk-modify-contacts-of-contacts.component.less']
})
export class BulkModifyContactsOfContactsComponent extends ConfirmOnFormChanges implements OnInit, OnDestroy {

    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    @ViewChild('inputForMakingFormDirty') inputForMakingFormDirty;
    @ViewChild('hotTableWrapper') hotTableWrapper: HotTableWrapperComponent;

    // selected outbreak
    selectedOutbreak: OutbreakModel;

    // options for dropdown cells
    genderList$: Observable<LabelValuePair[]>;
    occupationsList$: Observable<LabelValuePair[]>;
    riskLevelsList$: Observable<LabelValuePair[]>;

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
    extraContactOfContactData: {
        id: string,
        addresses: AddressModel[],
    }[];

    // subscribers
    outbreakSubscriber: Subscription;
    queryParamsSubscriber: Subscription;

    // authenticated user details
    authUser: UserModel;

    // ids of contacts of contacts we want to modify
    contactOfContactIds: string[];
    /**
     * Constructor
     */
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private contactsOfContactsDataService: ContactsOfContactsDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private referenceDataDataService: ReferenceDataDataService,
        private i18nService: I18nService,
        private dialogService: DialogService,
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
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER).pipe(share());
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION).pipe(share());
        this.riskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL).pipe(share());

        // init table columns
        this.configureSheetWidget();

        // retrieve query params
        this.queryParamsSubscriber = this.route.queryParams
            .subscribe((params: { contactOfContactIds }) => {
                this.contactOfContactIds = params.contactOfContactIds ? JSON.parse(params.contactOfContactIds) : [];
            });

        // get selected outbreak
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreak()
            .pipe(
                catchError((err) => {
                    // show error message
                    this.snackbarService.showApiError(err);
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
        this.breadcrumbs = [];

        // contacts of contacts list page
        if (ContactOfContactModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE', '/contacts-of-contacts')
            );
        }

        // current page breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                'LNG_PAGE_BULK_MODIFY_CONTACT_OF_CONTACTS_TITLE',
                '.',
                true
            )
        );
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
        const loadingDialog = this.dialogService.showLoadingDialog();
        this.loadingData = true;
        this.contactsOfContactsDataService
            .getContactsOfContactsList(this.selectedOutbreak.id, qb)
            .pipe(catchError((err) => {
                loadingDialog.close();
                this.snackbarService.showApiError(err);
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
                            case 'addresses.phoneNumber':
                                addressModel = AddressModel.getCurrentAddress(contactOfContact.addresses);
                                value = addressModel ? addressModel.phoneNumber : null;
                                break;
                            case 'addresses.city':
                                addressModel = AddressModel.getCurrentAddress(contactOfContact.addresses);
                                value = addressModel ? addressModel.city : null;
                                break;
                            case 'addresses.postalCode':
                                addressModel = AddressModel.getCurrentAddress(contactOfContact.addresses);
                                value = addressModel ? addressModel.postalCode : null;
                                break;
                            case 'addresses.locationId':
                                addressModel = AddressModel.getCurrentAddress(contactOfContact.addresses);
                                value = addressModel ? addressModel.locationId : null;
                                break;
                            case 'addresses.addressLine1':
                                addressModel = AddressModel.getCurrentAddress(contactOfContact.addresses);
                                value = addressModel ? addressModel.addressLine1 : null;
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
                                    value = value ? this.i18nService.instant(value) : null;
                                }
                                break;
                        }

                        // finished
                        contactOfContactData.push(value !== undefined ? value : null);
                    });

                    // return spreadsheet data
                    this.extraContactOfContactData.push({
                        id: contactOfContact.id,
                        addresses: contactOfContact.addresses,
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
                .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME')
                .setProperty('lastName'),
            new DropdownSheetColumn()
                .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER')
                .setProperty('gender')
                .setOptions(this.genderList$, this.i18nService),
            new DateSheetColumn(
                null,
                moment())
                .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING')
                .setProperty('dateOfReporting')
                .setRequired(),
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
            new DropdownSheetColumn()
                .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL')
                .setProperty('riskLevel')
                .setOptions(this.riskLevelsList$, this.i18nService),
            new TextSheetColumn()
                .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_REASON')
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
                        'LNG_PAGE_BULK_MODIFY_CONTACTS_OF_CONTACTS_LABEL_ERROR_MSG'
                    );

                    // show error
                    loadingDialog.close();
                    this.snackbarService.showError('LNG_PAGE_BULK_MODIFY_CONTACTS_OF_CONTACTS_WARNING_INVALID_FIELDS');
                } else {
                    // collect data from table
                    this.hotTableWrapper.getData()
                        .subscribe((dataResponse: {
                            data: any[],
                            sheetCore: Handsontable
                        }) => {
                            // add id
                            (dataResponse.data || []).forEach((contactOfContactData, index: number) => {
                                // set data
                                contactOfContactData.id = this.extraContactOfContactData[index].id;

                                // create / modify address phone number
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

                                    // replace phone number
                                    if (contactOfContactData.addresses.phoneNumber !== undefined) {
                                        address.phoneNumber = contactOfContactData.addresses.phoneNumber;
                                    } else {
                                        address.phoneNumber = null;
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

                                    // replace locationId
                                    if (contactOfContactData.addresses.locationId !== undefined) {
                                        address.locationId = contactOfContactData.addresses.locationId;
                                    } else {
                                        address.locationId = null;
                                    }

                                    // replace address1
                                    if (contactOfContactData.addresses.addressLine1 !== undefined) {
                                        address.addressLine1 = contactOfContactData.addresses.addressLine1;
                                    } else {
                                        address.addressLine1 = null;
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
                                        this.snackbarService.showApiError(err);
                                        return throwError(err);
                                    })
                                )
                                .subscribe(() => {
                                    this.snackbarService.showSuccess('LNG_PAGE_BULK_MODIFY_CONTACTS_OF_CONTACTS_ACTION_MODIFY_CONTACTS_SUCCESS_MESSAGE');

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
