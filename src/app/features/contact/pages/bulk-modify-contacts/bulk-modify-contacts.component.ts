import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable, throwError } from 'rxjs';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import * as _ from 'lodash';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { AbstractSheetColumn, DateSheetColumn, DropdownSheetColumn, IntegerSheetColumn, TextSheetColumn } from '../../../../core/models/sheet/sheet.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { ContactModel } from '../../../../core/models/contact.model';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { catchError, share } from 'rxjs/operators';
import { moment } from '../../../../core/helperClasses/x-moment';
import { HotTableWrapperComponent } from '../../../../shared/components/hot-table-wrapper/hot-table-wrapper.component';
import { Constants } from '../../../../core/models/constants';
import { Subscription } from 'rxjs/internal/Subscription';
import { SheetCellType } from '../../../../core/models/sheet/sheet-cell-type';
import * as Handsontable from 'handsontable';

@Component({
    selector: 'app-bulk-modify-contacts',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './bulk-modify-contacts.component.html',
    styleUrls: ['./bulk-modify-contacts.component.less']
})
export class BulkModifyContactsComponent extends ConfirmOnFormChanges implements OnInit, OnDestroy {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts'),
        new BreadcrumbItemModel('LNG_PAGE_BULK_MODIFY_CONTACTS_TITLE', '.', true)
    ];

    @ViewChild('inputForMakingFormDirty') inputForMakingFormDirty;
    @ViewChild('hotTableWrapper') hotTableWrapper: HotTableWrapperComponent;

    // selected outbreak
    selectedOutbreak: OutbreakModel;

    // options for dropdown cells
    genderList$: Observable<LabelValuePair[]>;
    occupationsList$: Observable<LabelValuePair[]>;
    riskLevelsList$: Observable<LabelValuePair[]>;
    finalFollowUpStatus$: Observable<LabelValuePair[]>;

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

    data: any[][] = [];
    extraContactData: {
        id: string,
        addresses: AddressModel[]
    }[];

    // subscribers
    outbreakSubscriber: Subscription;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private contactDataService: ContactDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private referenceDataDataService: ReferenceDataDataService,
        private i18nService: I18nService,
        private dialogService: DialogService
    ) {
        super();
    }

    ngOnInit() {
        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER).pipe(share());
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION).pipe(share());
        this.riskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL).pipe(share());
        this.finalFollowUpStatus$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_FINAL_FOLLOW_UP_STATUS);

        // init table columns
        setTimeout(() => {
            this.configureSheetWidget();
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

                // retrieve query params
                this.route.queryParams
                    .subscribe((params: { contactIds }) => {
                        // retrieve contacts information
                        this.retrieveContacts(params.contactIds ? JSON.parse(params.contactIds) : []);
                    });
            });
    }

    ngOnDestroy() {
        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
    }

    /**
     * Retrieve contacts
     */
    private retrieveContacts(contactIds: number[]) {
        // no contact ids ?
        if (
            !contactIds ||
            contactIds.length < 1
        ) {
            this.router.navigate(['/contacts']);
        }

        // outbreak not retrieved ?
        if (
            !this.selectedOutbreak ||
            !this.selectedOutbreak.id
        ) {
            return;
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
        this.contactDataService
            .getContactsList(this.selectedOutbreak.id, qb)
            .pipe(catchError((err) => {
                this.snackbarService.showApiError(err);
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
                            // case 'addresses.locationId':
                            //     addressModel = AddressModel.getCurrentAddress(contact.addresses);
                            //     value = addressModel ? _.find(this.existingLocations, { value: addressModel.locationId }) : null;
                            //     value = value ? value.label : null;
                            //     break;
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
                                value = value ? this.i18nService.instant(value) : null;
                                break;
                        }

                        // finished
                        contactData.push(value !== undefined ? value : null);
                    });

                    // return spreadsheet data
                    this.extraContactData.push({
                        id: contact.id,
                        addresses: contact.addresses
                    });

                    // finished
                    return contactData;
                });

                // init table columns
                this.configureSheetWidget();
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
            // new DropdownSheetColumn()
            //     .setTitle('LNG_ADDRESS_FIELD_LABEL_LOCATION')
            //     .setProperty('addresses.locationId')
            //     .setOptions(this.allLocationsListOptions, this.i18nService),
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
                .setTitle('LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS')
                .setProperty('followUp.status')
                .setOptions(this.finalFollowUpStatus$, this.i18nService),
            new DropdownSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_RISK_LEVEL')
                .setProperty('riskLevel')
                .setOptions(this.riskLevelsList$, this.i18nService),
            new TextSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_RISK_REASON')
                .setProperty('riskReason'),
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
                    this.snackbarService.showError('LNG_PAGE_BULK_MODIFY_CONTACTS_WARNING_INVALID_FIELDS');
                } else {
                    // collect data from table
                    this.hotTableWrapper.getData()
                        .subscribe((dataResponse: {
                            data: any[],
                            sheetCore: Handsontable
                        }) => {
                            // add id
                            (dataResponse.data || []).forEach((contactData, index: number) => {
                                // set data
                                contactData.id = this.extraContactData[index].id;

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
                                        this.snackbarService.showApiError(err);
                                        return throwError(err);
                                    })
                                )
                                .subscribe(() => {
                                    this.snackbarService.showSuccess('LNG_PAGE_BULK_MODIFY_CONTACTS_ACTION_MODIFY_CONTACTS_SUCCESS_MESSAGE');

                                    // navigate to listing page
                                    this.disableDirtyConfirm();
                                    loadingDialog.close();
                                    this.router.navigate(['/contacts']);
                                });
                        });
                }
            });
    }
}
