import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Observable } from 'rxjs/Observable';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { CaseModel } from '../../../../core/models/case.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Constants } from '../../../../core/models/constants';
import { FilterType, FilterModel } from '../../../../shared/components/side-filters/model';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { ActivatedRoute } from '@angular/router';
import { EntityType } from '../../../../core/models/entity-type';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import * as moment from 'moment';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import * as _ from 'lodash';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';
import { CountedItemsListItem } from '../../../../shared/components/counted-items-list/counted-items-list.component';
import { tap } from 'rxjs/operators';

@Component({
    selector: 'app-cases-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cases-list.component.html',
    styleUrls: ['./cases-list.component.less']
})
export class CasesListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;
    // selected Outbreak
    selectedOutbreak: OutbreakModel;
    // list of existing cases
    casesList$: Observable<CaseModel[]>;
    casesListCount$: Observable<any>;

    // cases grouped by classification
    countedCasesGroupedByClassification$: Observable<any>;

    caseClassificationsList$: Observable<any[]>;
    caseClassificationsListMap: { [id: string]: ReferenceDataEntryModel };
    genderList$: Observable<any[]>;
    yesNoOptionsList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;
    clustersListAsLabelValuePair$: Observable<LabelValuePair[]>;

    // available side filters
    availableSideFilters: FilterModel[] = [];

    // provide constants to template
    Constants = Constants;
    EntityType = EntityType;
    UserSettings = UserSettings;
    ReferenceDataCategory = ReferenceDataCategory;

    exportCasesUrl: string;
    casesDataExportFileName: string = moment().format('YYYY-MM-DD');
    allowedExportTypes: ExportDataExtension[] = [
        ExportDataExtension.CSV,
        ExportDataExtension.XLS,
        ExportDataExtension.XLSX,
        ExportDataExtension.XML,
        ExportDataExtension.JSON,
        ExportDataExtension.ODS,
        ExportDataExtension.PDF
    ];

    anonymizeFields: LabelValuePair[] = [
        new LabelValuePair('LNG_CASE_FIELD_LABEL_ID', 'id'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_FIRST_NAME', 'firstName'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_MIDDLE_NAME', 'middleName'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_LAST_NAME', 'lastName'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_GENDER', 'gender'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_PHONE_NUMBER', 'phoneNumber'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_OCCUPATION', 'occupation'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_DOB', 'dob'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_AGE', 'age'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_RISK_LEVEL', 'riskLevel'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_RISK_REASON', 'riskReason'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_DOCUMENTS', 'documents'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_ADDRESSES', 'addresses'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_CLASSIFICATION', 'classification'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION', 'dateOfInfection'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_DATE_OF_ONSET', 'dateOfOnset'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_IS_DATE_OF_ONSET_APPROXIMATE', 'isDateOfOnsetApproximate'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME', 'dateOfOutcome'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE', 'dateBecomeCase'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_DECEASED', 'deceased'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_DATE_DECEASED', 'dateDeceased'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_HOSPITALIZATION_DATES', 'hospitalizationDates'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_ISOLATION_DATES', 'isolationDates'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_INCUBATION_DATES', 'incubationDates'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_QUESTIONNAIRE_ANSWERS', 'questionnaireAnswers'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_TYPE', 'type'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING', 'dateOfReporting'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE', 'isDateOfReportingApproximate'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED', 'transferRefused')
    ];

    constructor(
        private caseDataService: CaseDataService,
        private authDataService: AuthDataService,
        protected snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private dialogService: DialogService,
        protected route: ActivatedRoute,
        protected listFilterDataService: ListFilterDataService,
        private i18nService: I18nService,
        private genericDataService: GenericDataService,
        private clusterDataService: ClusterDataService
    ) {
        super(
            snackbarService,
            listFilterDataService,
            route.queryParams
        );
    }

    ngOnInit() {
        // add page title
        this.casesDataExportFileName = this.i18nService.instant('LNG_PAGE_LIST_CASES_TITLE') +
            ' - ' +
            this.casesDataExportFileName;

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER).share();
        const caseClassifications$ = this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.CASE_CLASSIFICATION).share();
        this.caseClassificationsList$ = caseClassifications$.map((data: ReferenceDataCategoryModel) => {
            return _.map(data.entries, (entry: ReferenceDataEntryModel) =>
                new LabelValuePair(entry.value, entry.id, null, null, entry.iconUrl)
            );
        });
        caseClassifications$.subscribe((caseClassificationCategory: ReferenceDataCategoryModel) => {
            this.caseClassificationsListMap = _.transform(
                caseClassificationCategory.entries,
                (result, entry: ReferenceDataEntryModel) => {
                    // groupBy won't work here since groupBy will put an array instead of one value
                    result[entry.id] = entry;
                },
                {}
            );
        });
        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);

        // subscribe to the Selected Outbreak Subject stream
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // export cases url
                this.exportCasesUrl = null;
                if (
                    this.selectedOutbreak &&
                    this.selectedOutbreak.id
                ) {
                    this.exportCasesUrl = `/outbreaks/${this.selectedOutbreak.id}/cases/export`;

                    this.clustersListAsLabelValuePair$ = this.clusterDataService.getClusterListAsLabelValue(this.selectedOutbreak.id);

                    this.countedCasesGroupedByClassification$ = caseClassifications$
                        .mergeMap((refClassificationData: ReferenceDataCategoryModel) => {
                            return this.caseDataService
                                .getCasesGroupedByClassification(this.selectedOutbreak.id)
                                .map((data) => {
                                    return _.map(data ? data.classification : [], (item, itemId) => {
                                        const refItem: ReferenceDataEntryModel = _.find(refClassificationData.entries, {id: itemId});
                                        return new CountedItemsListItem(
                                            item.count,
                                            itemId,
                                            item.caseIDs,
                                            refItem ?
                                                refItem.getColorCode() :
                                                Constants.DEFAULT_COLOR_REF_DATA
                                        );
                                    });
                                });
                        });
                    // initialize side filters
                    this.initializeSideFilters();
                }

                // initialize pagination
                this.initPaginator();
                // ...and re-load the list when the Selected Outbreak is changed
                this.needsRefreshList(true);
            });

        // initialize Side Table Columns
        this.initializeSideTableColumns();
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
                label: 'LNG_CASE_FIELD_LABEL_LAST_NAME'
            }),
            new VisibleColumnModel({
                field: 'firstName',
                label: 'LNG_CASE_FIELD_LABEL_FIRST_NAME'
            }),
            new VisibleColumnModel({
                field: 'classification',
                label: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION'
            }),
            new VisibleColumnModel({
                field: 'age',
                label: 'LNG_CASE_FIELD_LABEL_AGE'
            }),
            new VisibleColumnModel({
                field: 'gender',
                label: 'LNG_CASE_FIELD_LABEL_GENDER'
            }),
            new VisibleColumnModel({
                field: 'dateOfOnset',
                label: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET'
            }),
            new VisibleColumnModel({
                field: 'deleted',
                label: 'LNG_CASE_FIELD_LABEL_DELETED'
            }),
            new VisibleColumnModel({
                field: 'wasContact',
                label: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT'
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
        const caseRiskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL);
        const yesNoOptionsWithoutAllList$ = this.genericDataService.getFilterYesNoOptions(true);
        const outcomeList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OUTCOME);

        // set available side filters
        this.availableSideFilters = [
            // Case
            new FilterModel({
                fieldName: 'firstName',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'middleName',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'lastName',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'gender',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_GENDER',
                type: FilterType.MULTISELECT,
                options$: this.genderList$,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'age',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_AGE',
                type: FilterType.RANGE_AGE,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'addresses',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_ADDRESSES',
                type: FilterType.ADDRESS
            }),
            new FilterModel({
                fieldName: 'dob',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_DOB',
                type: FilterType.RANGE_DATE,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'phoneNumber',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_PHONE_NUMBER',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'occupation',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_OCCUPATION',
                type: FilterType.MULTISELECT,
                options$: this.occupationsList$,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'riskLevel',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_RISK_LEVEL',
                type: FilterType.MULTISELECT,
                options$: caseRiskLevelsList$
            }),
            new FilterModel({
                fieldName: 'riskReason',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_RISK_REASON',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'visualId',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_LAST_VISUAL_ID',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'classification',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
                type: FilterType.MULTISELECT,
                options$: this.caseClassificationsList$
            }),
            new FilterModel({
                fieldName: 'dateOfInfection',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION',
                type: FilterType.RANGE_DATE
            }),
            new FilterModel({
                fieldName: 'dateOfOnset',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET',
                type: FilterType.RANGE_DATE
            }),
            new FilterModel({
                fieldName: 'dateOfOutcome',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME',
                type: FilterType.RANGE_DATE
            }),
            new FilterModel({
                fieldName: 'dateBecomeCase',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE',
                type: FilterType.RANGE_DATE
            }),
            new FilterModel({
                fieldName: 'deceased',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_DECEASED',
                type: FilterType.SELECT,
                options$: yesNoOptionsWithoutAllList$
            }),
            new FilterModel({
                fieldName: 'dateDeceased',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_DECEASED',
                type: FilterType.RANGE_DATE
            }),
            new FilterModel({
                fieldName: 'safeBurial',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_SAFETY_BURIAL',
                type: FilterType.SELECT,
                options$: yesNoOptionsWithoutAllList$
            }),
            new FilterModel({
                fieldName: 'isDateOfOnsetApproximate',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_IS_DATE_OF_ONSET_APPROXIMATE',
                type: FilterType.SELECT,
                options$: yesNoOptionsWithoutAllList$
            }),
            new FilterModel({
                fieldName: 'dateOfReporting',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING',
                type: FilterType.RANGE_DATE
            }),
            new FilterModel({
                fieldName: 'isDateOfReportingApproximate',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
                type: FilterType.SELECT,
                options$: yesNoOptionsWithoutAllList$
            }),
            new FilterModel({
                fieldName: 'transferRefused',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED',
                type: FilterType.SELECT,
                options$: yesNoOptionsWithoutAllList$
            }),
            new FilterModel({
                fieldName: 'outcomeId',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_OUTCOME',
                type: FilterType.MULTISELECT,
                options$: outcomeList$
            }),
            new FilterModel({
                fieldName: 'wasContact',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT',
                type: FilterType.SELECT,
                options$: yesNoOptionsWithoutAllList$
            }),
            new FilterModel({
                fieldName: 'clusterId',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_CLUSTER_NAME',
                type: FilterType.MULTISELECT,
                options$: this.clustersListAsLabelValuePair$,
                relationshipPath: ['relationships'],
                relationshipLabel: 'LNG_CASE_FIELD_LABEL_CLUSTER'
            })
        ];
    }

    /**
     * Re(load) the Cases list, based on the applied filter, sort criterias
     */
    refreshList() {
        if (this.selectedOutbreak) {
            // retrieve the list of Cases
            this.casesList$ = this.caseDataService.getCasesList(this.selectedOutbreak.id, this.queryBuilder)
                .pipe(tap(this.checkEmptyList.bind(this)));
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
            this.casesListCount$ = this.caseDataService.getCasesCount(this.selectedOutbreak.id, countQueryBuilder).share();
        }
    }

    /**
     * Check if we have write access to cases
     * @returns {boolean}
     */
    hasCaseWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CASE);
    }

    /**
     * Check if we have access view a contact
     * @returns {boolean}
     */
    hasContactReadAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.READ_CONTACT);
    }

    /**
     * Check if we have access to create a contact
     * @returns {boolean}
     */
    hasContactWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CONTACT);
    }

    /**
     * Check if we have access to reports
     * @returns {boolean}
     */
    hasReportAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.READ_REPORT);
    }

    /**
     * Retrieve Case classification color accordingly to Case's Classification value
     * @param item
     */
    getCaseClassificationColor(item: CaseModel) {
        const classificationData = _.get(this.caseClassificationsListMap, item.classification);
        return _.get(classificationData, 'colorCode', '');
    }

    /**
     * Delete specific case from the selected outbreak
     * @param {CaseModel} caseModel
     */
    deleteCase(caseModel: CaseModel) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_CASE', caseModel)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete case
                    this.caseDataService
                        .deleteCase(this.selectedOutbreak.id, caseModel.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_CASES_ACTION_DELETE_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Restore a case that was deleted
     * @param {CaseModel} caseModel
     */
    restoreCase(caseModel: CaseModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_RESTORE_CASE', new CaseModel(caseModel))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.caseDataService
                        .restoreCase(this.selectedOutbreak.id, caseModel.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);
                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_CASES_ACTION_RESTORE_SUCCESS_MESSAGE');
                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Convert a case to contact
     * @param caseModel
     */
    convertCaseToContact(caseModel: CaseModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_CONVERT_CASE_TO_CONTACT', new CaseModel(caseModel))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.caseDataService
                        .convertToContact(this.selectedOutbreak.id, caseModel.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);
                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_CASES_ACTION_CONVERT_TO_CONTACT_SUCCESS_MESSAGE');
                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Export selected records
     */
    exportSelectedCases() {
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
            url: this.exportCasesUrl,
            fileName: this.casesDataExportFileName,

            // // optional
            allowedExportTypes: this.allowedExportTypes,
            queryBuilder: qb,
            displayEncrypt: true,
            displayAnonymize: true,
            anonymizeFields: this.anonymizeFields
        });
    }

    /**
     * Export empty case investigation
     */
    exportEmptyCaseInvestigation(caseModel: CaseModel) {
        // display export only if we have a selected outbreak
        if (this.selectedOutbreak) {
            // display export dialog
            this.dialogService.showExportDialog({
                message: 'LNG_PAGE_LIST_CASES_EXPORT_EMPTY_CASE_INVESTIGATION_TITLE',
                url: `outbreaks/${this.selectedOutbreak.id}/cases/${caseModel.id}/export-empty-case-investigation`,
                fileName: this.casesDataExportFileName,
                fileType: ExportDataExtension.ZIP
            });
        }
    }

    /**
     * Export cases dossier
     */
    exportSelectedCasesDossier() {
        // get list of follow-ups that we want to modify
        const selectedRecords: false | string[] = this.validateCheckedRecords();
        if (!selectedRecords) {
            return;
        }

        // display export only if we have a selected outbreak
        if (this.selectedOutbreak) {
            // remove id from list
            const anonymizeFields = _.filter(this.anonymizeFields, (value: LabelValuePair) => {
                return value.value !== 'id';
            });

            // display export dialog
            this.dialogService.showExportDialog({
                message: 'LNG_PAGE_LIST_CASES_GROUP_ACTION_EXPORT_SELECTED_CASES_DOSSIER_DIALOG_TITLE',
                url: `outbreaks/${this.selectedOutbreak.id}/cases/dossier`,
                fileName: this.casesDataExportFileName,
                fileType: ExportDataExtension.ZIP,
                displayAnonymize: true,
                anonymizeFields: anonymizeFields,
                anonymizeFieldsKey: 'data',
                extraAPIData: {
                    cases: selectedRecords
                },
                isPOST: true
            });
        }
    }
}
