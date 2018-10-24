import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs/Observable';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ExposureTypeGroupModel } from '../../../../core/models/exposure-type-group';
import { ExposureTypeModel } from '../../../../core/models/exposure-type';
import { CountedItemsListItem } from '../../../../shared/components/counted-items-list/counted-items-list.component';
import {
    ReferenceDataCategory,
    ReferenceDataCategoryModel,
    ReferenceDataEntryModel
} from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ActivatedRoute } from '@angular/router';
import 'rxjs/add/operator/filter';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import * as _ from 'lodash';
import * as moment from 'moment';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { Constants } from '../../../../core/models/constants';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import 'rxjs/add/operator/mergeMap';

@Component({
    selector: 'app-contacts-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-list.component.html',
    styleUrls: ['./contacts-list.component.less']
})
export class ContactsListComponent extends ListComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '.', true)
    ];

    // constants
    Constants = Constants;

    // authenticated user
    authUser: UserModel;

    // list of existing contacts
    contactsList$: Observable<ContactModel[]>;
    contactsListCount$: Observable<any>;

    // contacts outbreak
    selectedOutbreak: OutbreakModel;

    // gender list
    genderList$: Observable<any[]>;

    // new contacts grouped by exposure types
    countedNewContactsGroupedByExposureType$: Observable<any[]>;

    // risk level
    riskLevelsList$: Observable<any[]>;
    riskLevelsListMap: { [id: string]: ReferenceDataEntryModel };

    // provide constants to template
    EntityType = EntityType;
    ReferenceDataCategory = ReferenceDataCategory;
    UserSettings = UserSettings;

    // yes / no / all options
    yesNoOptionsList$: Observable<any[]>;

    // available side filters
    availableSideFilters: FilterModel[];

    exportContactsUrl: string;
    contactsDataExportFileName: string = moment().format('YYYY-MM-DD');
    @ViewChild('buttonDownloadFile') private buttonDownloadFile: ElementRef;
    allowedExportTypes: ExportDataExtension[] = [
        ExportDataExtension.CSV,
        ExportDataExtension.XLS,
        ExportDataExtension.XLSX,
        ExportDataExtension.XML,
        ExportDataExtension.JSON,
        ExportDataExtension.ODS
    ];

    anonymizeFields: LabelValuePair[] = [
        new LabelValuePair( 'LNG_CONTACT_FIELD_LABEL_ID', 'id' ),
        new LabelValuePair( 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME', 'firstName' ),
        new LabelValuePair( 'LNG_CONTACT_FIELD_LABEL_MIDDLE_NAME', 'middleName' ),
        new LabelValuePair( 'LNG_CONTACT_FIELD_LABEL_LAST_NAME', 'lastName' ),
        new LabelValuePair( 'LNG_CONTACT_FIELD_LABEL_GENDER', 'gender' ),
        new LabelValuePair( 'LNG_CONTACT_FIELD_LABEL_PHONE', 'phoneNumber' ),
        new LabelValuePair( 'LNG_CONTACT_FIELD_LABEL_OCCUPATION', 'occupation' ),
        new LabelValuePair( 'LNG_CONTACT_FIELD_LABEL_DATE_OF_BIRTH', 'dob' ),
        new LabelValuePair( 'LNG_CONTACT_FIELD_LABEL_AGE', 'age' ),
        new LabelValuePair( 'LNG_CONTACT_FIELD_LABEL_DOCUMENTS', 'documents' ),
        new LabelValuePair( 'LNG_CONTACT_FIELD_LABEL_ADDRESSES', 'addresses' ),
        new LabelValuePair( 'LNG_CONTACT_FIELD_LABEL_RISK_LEVEL', 'riskLevel' ),
        new LabelValuePair( 'LNG_CONTACT_FIELD_LABEL_RISK_REASON', 'riskReason' ),
        new LabelValuePair( 'LNG_CONTACT_FIELD_LABEL_TYPE', 'type' ),
        new LabelValuePair( 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING', 'dateOfReporting' ),
        new LabelValuePair( 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE', 'isDateOfReportingApproximate' ),
        new LabelValuePair( 'LNG_CONTACT_FIELD_LABEL_DATE_DECEASED', 'dateDeceased' )
    ];

    constructor(
        private contactDataService: ContactDataService,
        private authDataService: AuthDataService,
        protected snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private route: ActivatedRoute,
        private dialogService: DialogService,
        protected listFilterDataService: ListFilterDataService,
        private i18nService: I18nService
    ) {
        super(
            snackbarService,
            listFilterDataService,
            route.queryParams
        );
    }

    ngOnInit() {
        // add page title
        this.contactsDataExportFileName = this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_TITLE') +
            ' - ' +
            this.contactsDataExportFileName;

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER).share();

        const riskLevel$ = this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.RISK_LEVEL).share();
        this.riskLevelsList$ = riskLevel$.map((data: ReferenceDataCategoryModel) => {
            return _.map(data.entries, (entry: ReferenceDataEntryModel) =>
                new LabelValuePair(entry.value, entry.id)
            );
        });
        riskLevel$.subscribe((riskCategory: ReferenceDataCategoryModel) => {
            this.riskLevelsListMap = _.transform(
                riskCategory.entries,
                (result, entry: ReferenceDataEntryModel) => {
                    // groupBy won't work here since groupBy will put an array instead of one value
                    result[entry.id] = entry;
                },
                {}
            );
        });

        // yes / no
        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();

        // subscribe to the Selected Outbreak
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // export contacts url
                this.exportContactsUrl = null;
                if (
                    this.selectedOutbreak &&
                    this.selectedOutbreak.id
                ) {
                    this.exportContactsUrl = `/outbreaks/${this.selectedOutbreak.id}/contacts/export`;
                }

                // get new contacts grouped by exposure types
                if (this.selectedOutbreak) {
                    this.countedNewContactsGroupedByExposureType$ = this.referenceDataDataService
                        .getReferenceDataByCategory(ReferenceDataCategory.EXPOSURE_TYPE)
                        .mergeMap((refExposureTypeData: ReferenceDataCategoryModel) => {
                            return this.contactDataService
                                .getNewContactsGroupedByExposureType(this.selectedOutbreak.id)
                                .map((data: ExposureTypeGroupModel) => {
                                    return _.map(data ? data.exposureType : [], (item: ExposureTypeModel) => {
                                        const refItem: ReferenceDataEntryModel = _.find(refExposureTypeData.entries, { id: item.id });
                                        return new CountedItemsListItem(
                                            item.count,
                                            item.id,
                                            item.contactIDs,
                                            refItem ?
                                                refItem.getColorCode() :
                                                Constants.DEFAULT_COLOR_REF_DATA
                                        );
                                    });
                                });
                        });
                }

                // initialize pagination
                this.initPaginator();
                // ...and re-load the list when the Selected Outbreak is changed
                this.needsRefreshList(true);
            });

        // initialize Side Table Columns
        this.initializeSideTableColumns();

        // initialize side filters
        this.initializeSideFilters();
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'checkbox',
                required: true,
                excludeFromSave: true
            }),
            new VisibleColumnModel({
                field: 'lastName',
                label: 'LNG_CONTACT_FIELD_LABEL_LAST_NAME'
            }),
            new VisibleColumnModel({
                field: 'firstName',
                label: 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME'
            }),
            new VisibleColumnModel({
                field: 'age',
                label: 'LNG_CONTACT_FIELD_LABEL_AGE'
            }),
            new VisibleColumnModel({
                field: 'gender',
                label: 'LNG_CONTACT_FIELD_LABEL_GENDER'
            }),
            new VisibleColumnModel({
                field: 'phoneNumber',
                label: 'LNG_CONTACT_FIELD_LABEL_PHONE'
            }),
            new VisibleColumnModel({
                field: 'riskLevel',
                label: 'LNG_CONTACT_FIELD_LABEL_RISK_LEVEL'
            }),
            new VisibleColumnModel({
                field: 'deleted',
                label: 'LNG_CONTACT_FIELD_LABEL_DELETED'
            }),
            new VisibleColumnModel({
                field: 'actions',
                required: true,
                excludeFromSave: true
            })
        ];
    }

    /**
     * Initialize Side Filters
     */
    initializeSideFilters() {
        const occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);
        const dailyStatusTypeOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_DAILY_FOLLOW_UP_STATUS);

        // case condition
        const caseCondition = new RequestQueryBuilder();
        caseCondition.filter.byEquality(
            'type',
            EntityType.CASE
        );

        // set available side filters
        this.availableSideFilters = [
            // Contact
            new FilterModel({
                fieldName: 'firstName',
                fieldLabel: 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'lastName',
                fieldLabel: 'LNG_CONTACT_FIELD_LABEL_LAST_NAME',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'occupation',
                fieldLabel: 'LNG_CONTACT_FIELD_LABEL_OCCUPATION',
                type: FilterType.MULTISELECT,
                options$: occupationsList$,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'age',
                fieldLabel: 'LNG_CONTACT_FIELD_LABEL_AGE',
                type: FilterType.RANGE_AGE,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'dateOfReporting',
                fieldLabel: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
                type: FilterType.RANGE_DATE,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'dob',
                fieldLabel: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_BIRTH',
                type: FilterType.RANGE_DATE,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'addresses',
                fieldLabel: 'LNG_CONTACT_FIELD_LABEL_ADDRESSES',
                type: FilterType.ADDRESS
            })
        ];

        // Relation - Follow-up
        if (this.authUser.hasPermissions(PERMISSION.READ_FOLLOWUP)) {
            this.availableSideFilters = [
                ...this.availableSideFilters,
                ...[
                    new FilterModel({
                        fieldName: 'date',
                        fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_DATE',
                        type: FilterType.RANGE_DATE,
                        relationshipPath: ['followUps'],
                        relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
                    }),
                    new FilterModel({
                        fieldName: 'targeted',
                        fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED',
                        type: FilterType.SELECT,
                        options$: this.yesNoOptionsList$,
                        relationshipPath: ['followUps'],
                        relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
                    }),
                    new FilterModel({
                        fieldName: 'statusId',
                        fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
                        type: FilterType.SELECT,
                        options$: dailyStatusTypeOptions$,
                        relationshipPath: ['followUps'],
                        relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
                    })
                ]
            ];
        }

        // Relation - Cases
        if (this.authUser.hasPermissions(PERMISSION.READ_CASE)) {
            this.availableSideFilters = [
                ...this.availableSideFilters,
                ...[
                    new FilterModel({
                        fieldName: 'firstName',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
                        type: FilterType.TEXT,
                        relationshipPath: ['relationships', 'people'],
                        relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
                        extraConditions: caseCondition
                    }),
                    new FilterModel({
                        fieldName: 'lastName',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
                        type: FilterType.TEXT,
                        relationshipPath: ['relationships', 'people'],
                        relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
                        extraConditions: caseCondition
                    }),
                    new FilterModel({
                        fieldName: 'gender',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_GENDER',
                        type: FilterType.MULTISELECT,
                        options$: this.genderList$,
                        relationshipPath: ['relationships', 'people'],
                        relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
                        extraConditions: caseCondition
                    }),
                    new FilterModel({
                        fieldName: 'age',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_AGE',
                        type: FilterType.RANGE_AGE,
                        relationshipPath: ['relationships', 'people'],
                        relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
                        extraConditions: caseCondition
                    })
                ]
            ];
        }
    }

    /**
     * Re(load) the Contacts list
     */
    refreshList() {
        if (this.selectedOutbreak) {
            // retrieve the list of Contacts
            this.contactsList$ = this.contactDataService.getContactsList(this.selectedOutbreak.id, this.queryBuilder);
        }
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        if (this.selectedOutbreak) {
            // remove paginator from query builder
            const countQueryBuilder = _.cloneDeep(this.queryBuilder);
            countQueryBuilder.paginator.clear();
            this.contactsListCount$ = this.contactDataService.getContactsCount(this.selectedOutbreak.id, countQueryBuilder);
        }
    }

    /**
     * Check if we have write access to contacts
     * @returns {boolean}
     */
    hasContactWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CONTACT);
    }

    /**
     * Check if we have write access to case
     * @returns {boolean}
     */
    hasCaseWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CASE);
    }

    /**
     * Check if we have write access to follow-ups
     * @returns {boolean}
     */
    hasFollowUpWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_FOLLOWUP);
    }

    /**
     * Retrieve risk color accordingly to risk level
     * @param item
     */
    getRiskColor(item: ContactModel) {
        // get risk data color
        const riskData = _.get(this.riskLevelsListMap, item.riskLevel);
        if (riskData) {
            return riskData.colorCode ? riskData.colorCode : '';
        }

        // if we don't have risk data?
        return '';
    }

    /**
     * Delete specific contact that belongs to the selected outbreak
     * @param {ContactModel} contact
     */
    deleteContact(contact: ContactModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_CONTACT', contact)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete contact
                    this.contactDataService
                        .deleteContact(this.selectedOutbreak.id, contact.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_CONTACTS_ACTION_DELETE_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    restoreContact(contact: ContactModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_RESTORE_CONTACT', new ContactModel(contact))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.contactDataService
                        .restoreContact(this.selectedOutbreak.id, contact.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);
                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_CONTACTS_ACTION_RESTORE_SUCCESS_MESSAGE');
                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Convert a case to a contact
     * @param contactModel
     */
    convertContactToCase(contactModel: ContactModel) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_CONVERT_CONTACT_TO_CASE', contactModel)
            .subscribe((answer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.contactDataService
                        .convertContactToCase(this.selectedOutbreak.id, contactModel.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_CONTACTS_ACTION_CONVERT_CONTACT_TO_CASE_SUCCESS_MESSAGE');
                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Export selected records
     */
    exportSelectedContacts() {
        // get list of follow-ups that we want to modify
        const selectedRecords: false | string[] = this.validateCheckedRecords();
        if (!selectedRecords) {
            return;
        }

        // construct query builder
        const qb = new RequestQueryBuilder();
        qb.filter.bySelect(
            'id',
            selectedRecords,
            true,
            null
        );

        // display export dialog
        this.dialogService.showExportDialog({
            // required
            message: 'LNG_PAGE_LIST_CASES_EXPORT_TITLE',
            url: this.exportContactsUrl,
            fileName: this.contactsDataExportFileName,
            buttonDownloadFile: this.buttonDownloadFile,

            // // optional
            allowedExportTypes: this.allowedExportTypes,
            queryBuilder: qb,
            displayEncrypt: true,
            displayAnonymize: true,
            anonymizeFields: this.anonymizeFields
        });
    }
}
