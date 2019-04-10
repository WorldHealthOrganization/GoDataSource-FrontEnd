import { Component, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable } from 'rxjs';
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
import { DateSheetColumn, DropdownSheetColumn, IntegerSheetColumn, TextSheetColumn } from '../../../../core/models/sheet/sheet.model';
import { SheetCellType } from '../../../../core/models/sheet/sheet-cell-type';
import * as Handsontable from 'handsontable';
import { Constants } from '../../../../core/models/constants';
import { BulkContactsService } from '../../../../core/services/helper/bulk-contacts.service';
import { SheetCellValidator } from '../../../../core/models/sheet/sheet-cell-validator';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { EntityModel } from '../../../../core/models/entity.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { NgModel } from '@angular/forms';
import { ContactModel } from '../../../../core/models/contact.model';
import { throwError } from 'rxjs';
import { catchError, map, mergeMap, share } from 'rxjs/operators';

@Component({
    selector: 'app-bulk-create-contacts',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './bulk-create-contacts.component.html',
    styleUrls: ['./bulk-create-contacts.component.less']
})
export class BulkCreateContactsComponent extends ConfirmOnFormChanges implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [];

    // selected outbreak
    selectedOutbreak: OutbreakModel;
    // related entity
    relatedEntityType: EntityType;
    relatedEntityId: string;

    // options for dropdown cells
    genderList$: Observable<LabelValuePair[]>;
    occupationsList$: Observable<LabelValuePair[]>;
    addressTypesList$: Observable<LabelValuePair[]>;
    riskLevelsList$: Observable<LabelValuePair[]>;
    documentTypesList$: Observable<LabelValuePair[]>;
    certaintyLevelOptions$: Observable<LabelValuePair[]>;
    exposureTypeOptions$: Observable<LabelValuePair[]>;
    exposureFrequencyOptions$: Observable<LabelValuePair[]>;
    exposureDurationOptions$: Observable<LabelValuePair[]>;
    socialRelationshipOptions$: Observable<LabelValuePair[]>;

    relatedEntityData: CaseModel | EventModel;

    // sheet widget configuration
    sheetWidth = 500;
    sheetContextMenu = {};
    sheetColumns: any[] = [];

    // provide constants to template
    Constants = Constants;
    SheetCellType = SheetCellType;

    // error messages
    errorMessages: {
        message: string,
        data: {
            row: number,
            columns: string
        }
    }[] = [];

    afterChangeCallback: (
        sheetCore: Handsontable,
        changes: any[],
        source: string
    ) => void;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private contactDataService: ContactDataService,
        private entityDataService: EntityDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private referenceDataDataService: ReferenceDataDataService,
        private i18nService: I18nService,
        private bulkContactsService: BulkContactsService,
        private dialogService: DialogService
    ) {
        super();
    }

    ngOnInit() {
        this.setSheetWidth();

        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER).pipe(share());
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION).pipe(share());
        this.riskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL).pipe(share());
        this.addressTypesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.ADDRESS_TYPE).pipe(share());
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
            .subscribe((params: { entityType, entityId }) => {
                this.relatedEntityType = _.get(params, 'entityType');
                this.relatedEntityId = _.get(params, 'entityId');

                if (!this.validateRelatedEntity()) {
                    return;
                }

                this.initBreadcrumbs();

                // retrieve related person information
                this.retrieveRelatedPerson();
            });

        // get selected outbreak
        this.outbreakDataService
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

                this.retrieveRelatedPerson();
            });
    }

    /**
     * Init breadcrumbs
     */
    initBreadcrumbs() {
        if (this.relatedEntityType === EntityType.EVENT) {
            this.breadcrumbs = [
                new BreadcrumbItemModel('LNG_PAGE_LIST_EVENTS_TITLE', '/events'),
            ];
        } else {
            this.breadcrumbs = [
                new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
            ];
        }

        this.breadcrumbs.push.apply(this.breadcrumbs, [
            new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts'),
            new BreadcrumbItemModel('LNG_PAGE_BULK_ADD_CONTACTS_TITLE', '.', true)
        ]);
    }

    /**
     * Update sheet width based on browser width
     * Note: It's a hack, but there's no other fix for now, since handsontable is working with pixels only
     */
    @HostListener('window:resize')
    private setSheetWidth() {
        this.sheetWidth = window.innerWidth - 340;
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
                .setProperty('contact.firstName')
                .setRequired(),
            new TextSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_LAST_NAME')
                .setProperty('contact.lastName'),
            new DropdownSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_GENDER')
                .setProperty('contact.gender')
                .setOptions(this.genderList$, this.i18nService),
            new DateSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING')
                .setProperty('contact.dateOfReporting')
                .setRequired(),
            new DropdownSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_OCCUPATION')
                .setProperty('contact.occupation')
                .setOptions(this.occupationsList$, this.i18nService),
            new IntegerSheetColumn(
                0,
                Constants.DEFAULT_AGE_MAX_YEARS)
                .setTitle('LNG_CONTACT_FIELD_LABEL_AGE_YEARS')
                .setProperty('contact.age.years'),
            new IntegerSheetColumn(
                0,
                11)
                .setTitle('LNG_CONTACT_FIELD_LABEL_AGE_MONTHS')
                .setProperty('contact.age.months'),
            new DateSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_DATE_OF_BIRTH')
                .setProperty('contact.dob'),
            new DropdownSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_RISK_LEVEL')
                .setProperty('contact.riskLevel')
                .setOptions(this.riskLevelsList$, this.i18nService),
            new TextSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_RISK_REASON')
                .setProperty('contact.riskReason'),

            // Document(s)
            new DropdownSheetColumn()
                .setTitle('LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_TYPE')
                .setProperty('contact.documents[0].type')
                .setOptions(this.documentTypesList$, this.i18nService),
            new TextSheetColumn()
                .setTitle('LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_NUMBER')
                .setProperty('contact.documents[0].number'),

            // Address(es)
            new DropdownSheetColumn()
                .setTitle('LNG_ADDRESS_FIELD_LABEL_TYPE')
                .setProperty('contact.addresses[0].typeId')
                .setOptions(this.addressTypesList$, this.i18nService),
            new TextSheetColumn()
                .setTitle('LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1')
                .setProperty('contact.addresses[0].addressLine1'),
            new TextSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_PHONE_NUMBER')
                .setProperty('contact.addresses[0].phoneNumber'),

            // Relationship properties
            new DateSheetColumn()
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
     * 'Handsontable' hook before running validation on a cell
     */
    beforeValidateSheet(sheetCore: Handsontable, value: string, row: number, column: number) {
        // determine if row is empty
        const columnValues: any[] = sheetCore.getDataAtRow(row);
        columnValues[column] = value;

        // isEmptyRow doesn't work since values is changed after beforeValidateSheet
        if (_.isEmpty(_.filter(columnValues, (v) => v !== null && v !== ''))) {
            // mark this cell as being on an empty row, so we skip validation for it
            return SheetCellValidator.EMPTY_ROW_CELL_VALUE;
        } else {
            return value;
        }
    }

    /**
     * After removing row
     */
    afterRemoveRow(sheetCore: Handsontable, row: number) {
        // determine if row is empty
        const countedRows: number = sheetCore.countRows();
        while (row < countedRows) {
            // validate row
            if (_.isEmpty(_.filter(sheetCore.getDataAtRow(row), (v) => v !== null && v !== ''))) {
                _.each(
                    sheetCore.getCellMetaAtRow(row),
                    (column: {
                        valid?: boolean
                    }) => {
                        if (column.valid === false) {
                            column.valid = true;
                        }
                    }
                );
            }

            // check next row
            row++;
        }
    }

    /**
     * After changes
     */
    afterChange(
        inputForMakingFormDirty: NgModel
    ): (
        sheetCore: Handsontable,
        changes: any[],
        source: string
    ) => void {
        // return cached function
        if (this.afterChangeCallback) {
            return this.afterChangeCallback;
        }

        // create functions
        this.afterChangeCallback = (
            sheetCore: Handsontable,
            changes: any[],
            source: string
        ) => {
            if (source === 'edit') {
                // remove validations
                const row: number = changes[0][0];
                if (_.isEmpty(_.filter(sheetCore.getDataAtRow(row), (v) => v !== null && v !== ''))) {
                    // remove validations
                    _.each(
                        sheetCore.getCellMetaAtRow(row),
                        (column: {
                            valid?: boolean
                        }) => {
                            if (column.valid === false) {
                                column.valid = true;
                            }
                        }
                    );

                    // refresh
                    sheetCore.render();
                }

                // make form dirty
                if (!sheetCore.isEmptyRow(row)) {
                    inputForMakingFormDirty.control.markAsDirty();
                }
            }
        };

        // return newly created function
        return this.afterChangeCallback;
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
                .subscribe((relatedEntityData: CaseModel | EventModel) => {
                    // keep person data
                    this.relatedEntityData = relatedEntityData;
                });
        }
    }

    /**
     * Check that we have related Person Type and ID
     */
    private validateRelatedEntity() {
        if (
            this.relatedEntityId &&
            (
                this.relatedEntityType === EntityType.CASE ||
                this.relatedEntityType === EntityType.EVENT
            )
        ) {
            return true;
        }

        // related person data is wrong or missing
        this.snackbarService.showSuccess('LNG_PAGE_BULK_ADD_CONTACTS_WARNING_CASE_OR_EVENT_REQUIRED');

        // navigate to Cases/Events listing page
        this.redirectToRelatedEntityList();

        return false;
    }

    /**
     * Redirect to Cases or Events list, based on related Entity Type
     */
    private redirectToRelatedEntityList() {
        if (this.relatedEntityType === EntityType.EVENT) {
            this.router.navigate(['/events']);
        } else {
            this.router.navigate(['/cases']);
        }
    }

    /**
     * Create new Contacts
     * @param {any} sheetTable
     */
    addContacts(sheetTable: any) {
        const sheetCore: Handsontable = sheetTable.hotInstance;

        // validate sheet
        const loadingDialog = this.dialogService.showLoadingDialog();
        this.bulkContactsService
            .validateTable(sheetCore)
            .subscribe((response) => {
                // we can't continue if we have errors
                if (!response.isValid) {
                    // map error messages if any?
                    this.errorMessages = this.bulkContactsService.getErrors(
                        response,
                        'LNG_PAGE_BULK_ADD_CONTACTS_LABEL_ERROR_MSG'
                    );

                    // show error
                    loadingDialog.close();
                    this.snackbarService.showError('LNG_PAGE_BULK_ADD_CONTACTS_WARNING_INVALID_FIELDS');
                } else {
                    // collect data from table
                    this.bulkContactsService.getData(sheetCore, this.sheetColumns)
                        .pipe(
                            mergeMap((data) => {
                                // get Contact mask configured on outbreak
                                const contactMask = ContactModel.generateContactIDMask(this.selectedOutbreak.contactIdMask);

                                return this.contactDataService.checkContactVisualIDValidity(
                                    this.selectedOutbreak.id,
                                    contactMask,
                                    contactMask
                                )
                                    .pipe(
                                        map((isValid) => {
                                            if (isValid === true) {
                                                // add mask on all contacts
                                                data = data.map((contactEntry) => {
                                                    contactEntry.contact.visualId = contactMask;
                                                    return contactEntry;
                                                });
                                            } else {
                                                // do nothing; the mask will be omitted and the contacts will be created without a visual ID
                                            }

                                            return data;
                                        })
                                    );
                            })
                        )
                        .subscribe((data) => {
                            // no data to save ?
                            if (_.isEmpty(data)) {
                                // show error
                                loadingDialog.close();
                                this.snackbarService.showError('LNG_PAGE_BULK_ADD_CONTACTS_WARNING_NO_DATA');
                            } else {
                                // create contacts
                                this.contactDataService.bulkAddContacts(this.selectedOutbreak.id, this.relatedEntityType, this.relatedEntityId, data)
                                    .pipe(
                                        catchError((err) => {
                                            loadingDialog.close();
                                            this.snackbarService.showApiError(err.message);
                                            return throwError(err);
                                        })
                                    )
                                    .subscribe(() => {
                                        this.snackbarService.showSuccess('LNG_PAGE_BULK_ADD_CONTACTS_ACTION_CREATE_CONTACTS_SUCCESS_MESSAGE');

                                        // navigate to listing page
                                        this.disableDirtyConfirm();
                                        loadingDialog.close();
                                        this.router.navigate(['/' + EntityModel.getLinkForEntityType(this.relatedEntityType), this.relatedEntityId, 'view']);
                                    });
                            }
                        });
                }
            });
    }
}
