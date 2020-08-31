import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { HotTableWrapperComponent } from '../../../../shared/components/hot-table-wrapper/hot-table-wrapper.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { catchError, share } from 'rxjs/operators';
import * as _ from 'lodash';
import { Observable, Subscription, throwError } from 'rxjs';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { UserModel } from '../../../../core/models/user.model';
import { DateSheetColumn, DropdownSheetColumn, IntegerSheetColumn, LocationSheetColumn, TextSheetColumn } from '../../../../core/models/sheet/sheet.model';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/xt-forms/validators/general-async-validator.directive';
import { moment } from '../../../../core/helperClasses/x-moment';
import { Constants } from '../../../../core/models/constants';
import * as Handsontable from 'handsontable';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';

@Component({
    selector: 'app-bulk-create-contacts-of-contacts',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './bulk-create-contacts-of-contacts.component.html',
    styleUrls: ['./bulk-create-contacts-of-contacts.component.less']
})
export class BulkCreateContactsOfContactsComponent extends ConfirmOnFormChanges implements OnInit, OnDestroy {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    @ViewChild('inputForMakingFormDirty') inputForMakingFormDirty;
    @ViewChild('hotTableWrapper') hotTableWrapper: HotTableWrapperComponent;

    // selected outbreak
    selectedOutbreak: OutbreakModel;
    relatedEntityId: string;

    // contact options
    genderList$: Observable<LabelValuePair[]>;
    occupationsList$: Observable<LabelValuePair[]>;
    riskLevelsList$: Observable<LabelValuePair[]>;
    documentTypesList$: Observable<LabelValuePair[]>;

    // relationship options
    certaintyLevelOptions$: Observable<LabelValuePair[]>;
    exposureTypeOptions$: Observable<LabelValuePair[]>;
    exposureFrequencyOptions$: Observable<LabelValuePair[]>;
    exposureDurationOptions$: Observable<LabelValuePair[]>;
    socialRelationshipOptions$: Observable<LabelValuePair[]>;

    relatedEntityData: ContactModel;

    // sheet widget configuration
    sheetContextMenu = {};
    sheetColumns: any[] = [];

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

    // subscribers
    outbreakSubscriber: Subscription;

    // authenticated user details
    authUser: UserModel;

    /**
     * Constructor
     */
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private contactDataService: ContactDataService,
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
        this.documentTypesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.DOCUMENT_TYPE).pipe(share());
        this.certaintyLevelOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CERTAINTY_LEVEL).pipe(share());
        this.exposureTypeOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_TYPE).pipe(share());
        this.exposureFrequencyOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_FREQUENCY).pipe(share());
        this.exposureDurationOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_DURATION).pipe(share());
        this.socialRelationshipOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTEXT_OF_TRANSMISSION).pipe(share());

        // configure Sheet widget
        this.configureSheetWidget();

        // retrieve query params
        this.route.queryParams
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
                    this.snackbarService.showApiError(err);

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
        this.breadcrumbs = [];

        // contact list
        if (ContactModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
            );
        }

        // contacts list page
        if (ContactOfContactModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE', '/contacts-of-contacts')
            );
        }

        // current page breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                'LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_TITLE',
                '.',
                true
            )
        );
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
                .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME')
                .setProperty('contactOfContact.lastName'),
            new TextSheetColumn()
                .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID')
                .setProperty('contactOfContact.visualId')
                .setAsyncValidator((value: string, callback: (result: boolean) => void): void => {
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
                .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER')
                .setProperty('contactOfContact.gender')
                .setOptions(this.genderList$, this.i18nService),
            new DateSheetColumn(
                null,
                moment())
                .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING')
                .setProperty('contactOfContact.dateOfReporting')
                .setRequired(),
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
            new DropdownSheetColumn()
                .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL')
                .setProperty('contactOfContact.riskLevel')
                .setOptions(this.riskLevelsList$, this.i18nService),
            new TextSheetColumn()
                .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_REASON')
                .setProperty('contactOfContact.riskReason'),

            // Contact Address(es)
            new LocationSheetColumn()
                .setTitle('LNG_ADDRESS_FIELD_LABEL_LOCATION')
                .setProperty('contactOfContact.addresses[0].locationId')
                .setUseOutbreakLocations(true),
            new TextSheetColumn()
                .setTitle('LNG_ADDRESS_FIELD_LABEL_CITY')
                .setProperty('contactOfContact.addresses[0].city'),
            new TextSheetColumn()
                .setTitle('LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1')
                .setProperty('contactOfContact.addresses[0].addressLine1'),
            new TextSheetColumn()
                .setTitle('LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE')
                .setProperty('contactOfContact.addresses[0].postalCode'),
            new TextSheetColumn()
                .setTitle('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PHONE_NUMBER')
                .setProperty('contactOfContact.addresses[0].phoneNumber'),

            // Contact Document(s)
            new DropdownSheetColumn()
                .setTitle('LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_TYPE')
                .setProperty('contactOfContact.documents[0].type')
                .setOptions(this.documentTypesList$, this.i18nService),
            new TextSheetColumn()
                .setTitle('LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_NUMBER')
                .setProperty('contactOfContact.documents[0].number'),

            // Relationship properties
            new DateSheetColumn(
                null,
                moment())
                .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE')
                .setProperty('relationship.contactDate')
                .setRequired(),
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
                .setOptions(this.socialRelationshipOptions$, this.i18nService)
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
                        this.snackbarService.showApiError(err);

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
        this.snackbarService.showError('LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_WARNING_CONTACT_REQUIRED');

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
                        'LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_LABEL_ERROR_MSG'
                    );

                    // show error
                    loadingDialog.close();
                    this.snackbarService.showError('LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_WARNING_INVALID_FIELDS');
                } else {
                    // collect data from table
                    this.hotTableWrapper
                        .getData()
                        .subscribe((dataResponse: {
                            data: any[],
                            sheetCore: Handsontable
                        }) => {
                            // no data to save ?
                            if (_.isEmpty(dataResponse.data)) {
                                // show error
                                loadingDialog.close();
                                this.snackbarService.showError('LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_WARNING_NO_DATA');
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
                                            this.snackbarService.translateApiErrors(errors)
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
                                            this.snackbarService.showApiError(err);
                                            return throwError(err);
                                        })
                                    )
                                    .subscribe(() => {
                                        this.snackbarService.showSuccess('LNG_PAGE_BULK_ADD_CONTACTS_OF_CONTACTS_ACTION_CREATE_CONTACTS_SUCCESS_MESSAGE');

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
