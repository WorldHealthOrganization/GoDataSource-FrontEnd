import { Component, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable } from 'rxjs/Observable';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { CaseModel } from '../../../../core/models/case.model';
import { EntityType } from '../../../../core/models/entity-type';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { EventModel } from '../../../../core/models/event.model';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import * as _ from 'lodash';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { DateSheetColumn, DropdownSheetColumn, NumericSheetColumn, TextSheetColumn } from '../../../../core/models/sheet/sheet.model';
import { SheetCellType } from '../../../../core/models/sheet/sheet-cell-type';
import * as Handsontable from 'handsontable';
import { Constants } from '../../../../core/models/constants';
import { BulkAddContactsService } from '../../../../core/services/helper/bulk-add-contacts.service';

@Component({
    selector: 'app-bulk-create-contacts',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './bulk-create-contacts.component.html',
    styleUrls: ['./bulk-create-contacts.component.less']
})
export class BulkCreateContactsComponent extends ConfirmOnFormChanges implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts'),
        new BreadcrumbItemModel('LNG_PAGE_BULK_ADD_CONTACTS_TITLE', '.', true)
    ];

    // selected outbreak ID
    outbreakId: string;
    // related entity
    relatedEntityType: EntityType;
    relatedEntityId: string;

    genderList$: Observable<any[]>;
    genderLabelsList$: Observable<string[]>;
    occupationsList$: Observable<any[]>;
    occupationsLabelsList$: Observable<string[]>;
    addressTypesList$: Observable<any[]>;
    addressTypesLabelsList$: Observable<string[]>;
    riskLevelsList$: Observable<any[]>;
    riskLevelsLabelsList$: Observable<string[]>;
    documentTypesList$: Observable<any[]>;
    documentTypesLabelsList$: Observable<string[]>;
    certaintyLevelOptions$: Observable<any[]>;
    certaintyLevelLabelsOptions$: Observable<string[]>;
    exposureTypeOptions$: Observable<any[]>;
    exposureTypeLabelsOptions$: Observable<string[]>;
    exposureFrequencyOptions$: Observable<any[]>;
    exposureFrequencyLabelsOptions$: Observable<string[]>;
    exposureDurationOptions$: Observable<any[]>;
    exposureDurationLabelsOptions$: Observable<string[]>;
    socialRelationshipOptions$: Observable<any[]>;
    socialRelationshipLabelsOptions$: Observable<string[]>;

    relatedEntityData: CaseModel | EventModel;

    // sheet widget configuration
    sheetWidth = 500;
    sheetContextMenu = {};
    sheetColumns: any[] = [];
    sheetColumnValidators: any;

    // provide constants to template
    Constants = Constants;
    SheetCellType = SheetCellType;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private contactDataService: ContactDataService,
        private entityDataService: EntityDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private referenceDataDataService: ReferenceDataDataService,
        private i18nService: I18nService,
        private bulkAddContactsService: BulkAddContactsService
    ) {
        super();
    }

    ngOnInit() {
        this.setSheetWidth();

        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER).share();
        this.genderLabelsList$ = this.genderList$.map((result) => this.mapLabelValueToLabel(result));
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION).share();
        this.occupationsLabelsList$ = this.occupationsList$.map((result) => this.mapLabelValueToLabel(result));
        this.riskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL).share();
        this.riskLevelsLabelsList$ = this.riskLevelsList$.map((result) => this.mapLabelValueToLabel(result));
        this.addressTypesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.ADDRESS_TYPE).share();
        this.addressTypesLabelsList$ = this.addressTypesList$.map((result) => this.mapLabelValueToLabel(result));
        this.documentTypesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.DOCUMENT_TYPE).share();
        this.documentTypesLabelsList$ = this.documentTypesList$.map((result) => this.mapLabelValueToLabel(result));
        this.certaintyLevelOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CERTAINTY_LEVEL).share();
        this.certaintyLevelLabelsOptions$ = this.certaintyLevelOptions$.map((result) => this.mapLabelValueToLabel(result));
        this.exposureTypeOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_TYPE).share();
        this.exposureTypeLabelsOptions$ = this.exposureTypeOptions$.map((result) => this.mapLabelValueToLabel(result));
        this.exposureFrequencyOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_FREQUENCY).share();
        this.exposureFrequencyLabelsOptions$ = this.exposureFrequencyOptions$.map((result) => this.mapLabelValueToLabel(result));
        this.exposureDurationOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_DURATION).share();
        this.exposureDurationLabelsOptions$ = this.exposureDurationOptions$.map((result) => this.mapLabelValueToLabel(result));
        this.socialRelationshipOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTEXT_OF_TRANSMISSION).share();
        this.socialRelationshipLabelsOptions$ = this.socialRelationshipOptions$.map((result) => this.mapLabelValueToLabel(result));

        // configure spreadsheet widget
        this.configureSheetWidget();

        // retrieve query params
        this.route.queryParams
            .subscribe((params: { entityType, entityId }) => {
                this.relatedEntityType = _.get(params, 'entityType');
                this.relatedEntityId = _.get(params, 'entityId');

                if (!this.validateRelatedEntity()) {
                    return;
                }

                this.retrieveRelatedPerson();
            });

        // get selected outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .catch((err) => {
                // show error message
                this.snackbarService.showError(err.message);

                // navigate to Cases/Events listing page
                this.redirectToRelatedEntityList();
                return ErrorObservable.create(err);
            })
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.outbreakId = selectedOutbreak.id;

                this.retrieveRelatedPerson();
            });
    }

    /**
     * Update sheet width based on browser width
     * Note: It's a hack, but there's no other fix for now, since handsontable is working with pixels only
     */
    @HostListener('window:resize')
    private setSheetWidth() {
        this.sheetWidth = window.innerWidth - 340;
    }

    private mapLabelValueToLabel(items: LabelValuePair[]) {
        return items.map((item) => this.i18nService.instant(item.label));
    }

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
                .setOptions(this.genderLabelsList$),
            new TextSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_PHONE')
                .setProperty('contact.phone'),
            new DateSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING')
                .setProperty('contact.dateOfReporting')
                .setRequired(),
            new DropdownSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_OCCUPATION')
                .setProperty('contact.occupation')
                .setOptions(this.occupationsLabelsList$),
            new NumericSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_AGE_YEARS')
                .setProperty('contact.age.years'),
            new NumericSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_AGE_MONTHS')
                .setProperty('contact.age.months'),
            new DateSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_DATE_OF_BIRTH')
                .setProperty('contact.dob'),
            new DropdownSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_RISK_LEVEL')
                .setProperty('contact.riskLevel')
                .setOptions(this.riskLevelsLabelsList$),
            new TextSheetColumn()
                .setTitle('LNG_CONTACT_FIELD_LABEL_RISK_REASON')
                .setProperty('contact.riskReason'),

            // Document(s)
            new DropdownSheetColumn()
                .setTitle('LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_TYPE')
                .setProperty('contact.documents[0].type')
                .setOptions(this.documentTypesLabelsList$),
            new TextSheetColumn()
                .setTitle('LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_NUMBER')
                .setProperty('contact.documents[0].number'),

            // Address(es)
            new DropdownSheetColumn()
                .setTitle('LNG_ADDRESS_FIELD_LABEL_ADDRESS_TYPE')
                .setProperty('contact.addresses[0].typeId')
                .setOptions(this.addressTypesLabelsList$),
            new TextSheetColumn()
                .setTitle('LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1')
                .setProperty('contact.addresses[0].addressLine1'),

            // Relationship
            new DateSheetColumn()
                .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE')
                .setProperty('relationship.contactDate')
                .setRequired(),
            new DropdownSheetColumn()
                .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL')
                .setProperty('relationship.certaintyLevelId')
                .setOptions(this.certaintyLevelLabelsOptions$)
                .setRequired(),
            new DropdownSheetColumn()
                .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE')
                .setProperty('relationship.exposureTypeId')
                .setOptions(this.exposureTypeLabelsOptions$),
            new DropdownSheetColumn()
                .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY')
                .setProperty('relationship.exposureFrequencyId')
                .setOptions(this.exposureFrequencyLabelsOptions$),
            new DropdownSheetColumn()
                .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION')
                .setProperty('relationship.exposureDurationId')
                .setOptions(this.exposureDurationLabelsOptions$),
            new DropdownSheetColumn()
                .setTitle('LNG_RELATIONSHIP_FIELD_LABEL_RELATION')
                .setProperty('relationship.socialRelationshipTypeId')
                .setOptions(this.socialRelationshipLabelsOptions$)
        ];

        // configure context menu
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

    beforeValidateSheet(sheetCore: Handsontable, value: string, row: number, column: number) {
        if (
            value === null &&
            sheetCore.isEmptyRow(row)
        ) {
            // do not validate empty rows
            return 'empty-row';
        } else {
            return value;
        }
    }

    /**
     * Retrieve information of related person
     */
    private retrieveRelatedPerson() {
        if (
            this.outbreakId &&
            this.relatedEntityType &&
            this.relatedEntityId
        ) {
            // retrieve Case/Event information
            this.entityDataService
                .getEntity(this.relatedEntityType, this.outbreakId, this.relatedEntityId)
                .catch((err) => {
                    // show error message
                    this.snackbarService.showError(err.message);

                    // navigate to Cases/Events listing page
                    this.redirectToRelatedEntityList();

                    return ErrorObservable.create(err);
                })
                .subscribe((relatedEntityData: CaseModel | EventModel) => {
                    // initialize Case/Event
                    this.relatedEntityData = relatedEntityData;
                });
        }
    }

    /**
     * Check that we have related Entity Type and ID
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
        this.disableDirtyConfirm();

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
        this.bulkAddContactsService
            .validateTable(sheetCore)
            .subscribe((isValid) => {
                if (!isValid) {
                    // show error
                    this.snackbarService.showError('LNG_PAGE_BULK_ADD_CONTACTS_WARNING_INVALID_FIELDS!');
                } else {
                    // collect data from table
                    const data = this.bulkAddContactsService.getData(sheetCore, this.sheetColumns);

                    // #TODO API call - create contacts
                    this.snackbarService.showSuccess('TODO API call :)');
                }
            });
    }
}
