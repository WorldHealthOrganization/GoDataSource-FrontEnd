import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable, throwError } from 'rxjs';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { CaseModel } from '../../../../core/models/case.model';
import { EntityType } from '../../../../core/models/entity-type';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { EventModel } from '../../../../core/models/event.model';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import * as _ from 'lodash';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { DateSheetColumn, DropdownSheetColumn, IntegerSheetColumn, LocationSheetColumn, TextSheetColumn } from '../../../../core/models/sheet/sheet.model';
import * as Handsontable from 'handsontable';
import { Constants } from '../../../../core/models/constants';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { catchError, share } from 'rxjs/operators';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/xt-forms/validators/general-async-validator.directive';
import { moment } from '../../../../core/helperClasses/x-moment';
import { HotTableWrapperComponent } from '../../../../shared/components/hot-table-wrapper/hot-table-wrapper.component';
import { Subscription } from 'rxjs/internal/Subscription';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';

@Component({
    selector: 'app-bulk-create-contacts',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './bulk-create-contacts.component.html',
    styleUrls: ['./bulk-create-contacts.component.less']
})
export class BulkCreateContactsComponent extends ConfirmOnFormChanges implements OnInit, OnDestroy {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    @ViewChild('inputForMakingFormDirty') inputForMakingFormDirty;
    @ViewChild('hotTableWrapper') hotTableWrapper: HotTableWrapperComponent;

    // selected outbreak
    selectedOutbreak: OutbreakModel;
    // related entity
    relatedEntityType: EntityType;
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

    relatedEntityData: CaseModel | EventModel | ContactModel;

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

    contactVisualIdModel: {
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
        private entityDataService: EntityDataService,
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

        // retrieve query params
        this.route.queryParams
            .subscribe((params: { entityType, entityId }) => {
                this.relatedEntityType = _.get(params, 'entityType');
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

                    // navigate to Cases/Events listing page
                    this.redirectToRelatedEntityList();
                    return throwError(err);
                })
            )
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;
                // setting the contact visual id model
                this.contactVisualIdModel = {
                    mask : this.relatedEntityType !== EntityType.CONTACT ?
                        ContactModel.generateContactIDMask(this.selectedOutbreak.contactIdMask) :
                        ContactOfContactModel.generateContactOfContactIDMask((this.selectedOutbreak.contactOfContactIdMask))
                };

                this.retrieveRelatedPerson();
            });

        // configure Sheet widget
        this.configureSheetWidget();
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

        // case or event?
        if (this.relatedEntityType === EntityType.CASE) {
            // case list
            if (CaseModel.canList(this.authUser)) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
                );
            }
        } else if (this.relatedEntityType === EntityType.EVENT) {
            // event list
            if (EventModel.canList(this.authUser)) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel('LNG_PAGE_LIST_EVENTS_TITLE', '/events'),
                );
            }
        } else if (this.relatedEntityType === EntityType.CONTACT) {
            // contacts list
            if (ContactModel.canList(this.authUser)) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
                );
            }
        }

        // current page breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                'LNG_PAGE_BULK_ADD_CONTACTS_TITLE',
                '.',
                true
            )
        );
    }

    /**
     * Configure 'Handsontable'
     */
    private configureSheetWidget() {
    // build object string based on related entity type
        const contactObject = this.relatedEntityType === EntityType.CONTACT ? 'contactOfContact' : 'contact';
        // configure columns
        this.sheetColumns = [
            // Contact properties
            new TextSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_FIRST_NAME')
                .setProperty(`${contactObject}.firstName`)
                .setRequired(),
            new TextSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_LAST_NAME')
                .setProperty(`${contactObject}.lastName`),
            new TextSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_VISUAL_ID')
                .setProperty(`${contactObject}.visualId`)
                .setAsyncValidator((value: string, callback: (result: boolean) => void): void => {
                    if (_.isEmpty(value)) {
                        callback(true);
                    } else {
                        const visualIDTranslateData = {
                            mask: this.relatedEntityType !== EntityType.CONTACT ?
                                ContactModel.generateContactIDMask(this.selectedOutbreak.contactIdMask) :
                                ContactOfContactModel.generateContactOfContactIDMask((this.selectedOutbreak.contactOfContactIdMask))
                        };
                        // set visual ID validator
                        this.contactDataService.checkContactVisualIDValidity(
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
                .setTitle('LNG_CONTACT_FIELD_LABEL_GENDER')
                .setProperty(`${contactObject}.gender`)
                .setOptions(this.genderList$, this.i18nService),
            new DateSheetColumn(
                null,
                moment())
                .setTitle('LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING')
                .setProperty(`${contactObject}.dateOfReporting`)
                .setRequired(),
            new DropdownSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_OCCUPATION')
                .setProperty(`${contactObject}.occupation`)
                .setOptions(this.occupationsList$, this.i18nService),
            new IntegerSheetColumn(
                0,
                Constants.DEFAULT_AGE_MAX_YEARS)
                .setTitle('LNG_CONTACT_FIELD_LABEL_AGE_YEARS')
                .setProperty(`${contactObject}.age.years`),
            new IntegerSheetColumn(
                0,
                11)
                .setTitle('LNG_CONTACT_FIELD_LABEL_AGE_MONTHS')
                .setProperty(`${contactObject}.age.months`),
            new DateSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_DATE_OF_BIRTH')
                .setProperty(`${contactObject}.dob`),
            new DropdownSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_RISK_LEVEL')
                .setProperty(`${contactObject}.riskLevel`)
                .setOptions(this.riskLevelsList$, this.i18nService),
            new TextSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_RISK_REASON')
                .setProperty(`${contactObject}.riskReason`),

            // Contact Address(es)
            new LocationSheetColumn()
                .setTitle('LNG_ADDRESS_FIELD_LABEL_LOCATION')
                .setProperty(`${contactObject}.addresses[0].locationId`)
                .setUseOutbreakLocations(true),
            new TextSheetColumn()
                .setTitle('LNG_ADDRESS_FIELD_LABEL_CITY')
                .setProperty(`${contactObject}.addresses[0].city`),
            new TextSheetColumn()
                .setTitle('LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1')
                .setProperty(`${contactObject}.addresses[0].addressLine1`),
            new TextSheetColumn()
                .setTitle('LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE')
                .setProperty(`${contactObject}.addresses[0].postalCode`),
            new TextSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_PHONE_NUMBER')
                .setProperty(`${contactObject}.addresses[0].phoneNumber`),

            // Contact Document(s)
            new DropdownSheetColumn()
                .setTitle('LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_TYPE')
                .setProperty(`${contactObject}.documents[0].type`)
                .setOptions(this.documentTypesList$, this.i18nService),
            new TextSheetColumn()
                .setTitle('LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_NUMBER')
                .setProperty(`${contactObject}.documents[0].number`),

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
     * Retrieve information of related person (Case or Event)
     */
    private retrieveRelatedPerson() {
        if (
            this.selectedOutbreak &&
            this.selectedOutbreak.id &&
            this.relatedEntityType &&
            this.relatedEntityId
        ) {
            // retrieve related person information
            this.entityDataService
                .getEntity(this.relatedEntityType, this.selectedOutbreak.id, this.relatedEntityId)
                .pipe(
                    catchError((err) => {
                        // show error message
                        this.snackbarService.showApiError(err);

                        // navigate to Cases/Events listing page
                        this.redirectToRelatedEntityList();

                        return throwError(err);
                    })
                )
                .subscribe((relatedEntityData: CaseModel | EventModel | ContactModel) => {
                    // keep person data
                    this.relatedEntityData = relatedEntityData;
                });
        }
    }

    /**
     * Check that we have related Person Type and ID
     */
    private validateRelatedEntity() {
        if (this.relatedEntityId && this.relatedEntityType !== EntityType.CONTACT_OF_CONTACT) {
            return true;
        }

        // related person data is wrong or missing
        this.snackbarService.showSuccess('LNG_PAGE_BULK_ADD_CONTACTS_WARNING_CASE_OR_EVENT_REQUIRED');

        // navigate to Cases/Contacts/Events listing page
        this.redirectToRelatedEntityList();

        return false;
    }

    /**
     * Redirect to Cases or Events or Contacts list, based on related Entity Type
     */
    private redirectToRelatedEntityList() {
        if (
            this.relatedEntityType === EntityType.CASE &&
            CaseModel.canList(this.authUser)
        ) {
            this.router.navigate(['/cases']);
        } else if (
            this.relatedEntityType === EntityType.EVENT &&
            EventModel.canList(this.authUser)
        ) {
            this.router.navigate(['/events']);
        } else if (
            this.relatedEntityType === EntityType.CONTACT &&
            ContactModel.canList(this.authUser)
        ) {
            this.router.navigate(['/contacts']);
        } else {
            this.router.navigate(['/']);
        }
    }

    /**
     * Create new Contacts
     */
    addContacts() {
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
                        'LNG_PAGE_BULK_ADD_CONTACTS_LABEL_ERROR_MSG'
                    );

                    // show error
                    loadingDialog.close();
                    this.snackbarService.showError('LNG_PAGE_BULK_ADD_CONTACTS_WARNING_INVALID_FIELDS');
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
                                this.snackbarService.showError('LNG_PAGE_BULK_ADD_CONTACTS_WARNING_NO_DATA');
                            } else {
                                // create contacts
                                this.contactDataService
                                    .bulkAddContacts(
                                        this.selectedOutbreak.id,
                                        this.relatedEntityType,
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
                                                        message: 'LNG_PAGE_BULK_ADD_CONTACTS_LABEL_PARTIAL_ERROR_MSG'
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
                                                            message: 'LNG_PAGE_BULK_ADD_CONTACTS_LABEL_API_ERROR_MSG',
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
                                        this.snackbarService.showSuccess('LNG_PAGE_BULK_ADD_CONTACTS_ACTION_CREATE_CONTACTS_SUCCESS_MESSAGE');

                                        // navigate to listing page
                                        this.disableDirtyConfirm();
                                        loadingDialog.close();
                                        if (this.relatedEntityType === EntityType.CONTACT &&
                                            ContactOfContactModel.canList(this.authUser)
                                        ) {
                                            this.router.navigate(['/contacts-of-contacts']);
                                        } else if (ContactModel.canList(this.authUser)) {
                                            this.router.navigate(['/contacts']);
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
