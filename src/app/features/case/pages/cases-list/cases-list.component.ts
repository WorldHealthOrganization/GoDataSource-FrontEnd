import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
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
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { ActivatedRoute } from '@angular/router';
import { EntityType } from '../../../../core/models/entity-type';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import * as moment from 'moment';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import * as _ from 'lodash';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';

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

    caseClassificationsList$: Observable<any[]>;
    genderList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;

    // available side filters
    availableSideFilters: FilterModel[];

    // provide constants to template
    Constants = Constants;
    EntityType = EntityType;
    UserSettings = UserSettings;
    ReferenceDataCategory = ReferenceDataCategory;

    exportCasesUrl: string;
    casesDataExportFileName: string = moment().format('YYYY-MM-DD');
    @ViewChild('buttonDownloadFile') private buttonDownloadFile: ElementRef;
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
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_ID', 'id' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_FIRST_NAME', 'firstName' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME', 'middleName' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_LAST_NAME', 'lastName' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_GENDER', 'gender' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_PHONE_NUMBER', 'phoneNumber' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_OCCUPATION', 'occupation' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_DOB', 'dob' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_AGE', 'age' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_RISK_LEVEL', 'riskLevel' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_RISK_REASON', 'riskReason' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_DOCUMENTS', 'documents' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_ADDRESSES', 'addresses' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_CLASSIFICATION', 'classification' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION', 'dateOfInfection' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET', 'dateOfOnset' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_IS_DATE_OF_ONSET_APPROXIMATE', 'isDateOfOnsetApproximate' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME', 'dateOfOutcome' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE', 'dateBecomeCase' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_DECEASED', 'deceased' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_DATE_DECEASED', 'dateDeceased' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_HOSPITALIZATION_DATES', 'hospitalizationDates' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_ISOLATION_DATES', 'isolationDates' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_INCUBATION_DATES', 'incubationDates' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_QUESTIONNAIRE_ANSWERS', 'questionnaireAnswers' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_TYPE', 'type' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING', 'dateOfReporting' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE', 'isDateOfReportingApproximate' ),
        new LabelValuePair( 'LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED', 'transferRefused' )
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
        this.casesDataExportFileName = this.i18nService.instant('LNG_PAGE_LIST_CASES_TITLE') +
            ' - ' +
            this.casesDataExportFileName;

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER).share();
        this.caseClassificationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION);
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
                field: 'firstName',
                label: 'LNG_CASE_FIELD_LABEL_FIRST_NAME'
            }),
            new VisibleColumnModel({
                field: 'lastName',
                label: 'LNG_CASE_FIELD_LABEL_LAST_NAME'
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
                type: FilterType.RANGE_NUMBER,
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
            })

            // Relations
            // #TODO
        ];
    }

    /**
     * Re(load) the Cases list, based on the applied filter, sort criterias
     */
    refreshList() {
        if (this.selectedOutbreak) {
            // retrieve the list of Cases
            this.casesList$ = this.caseDataService.getCasesList(this.selectedOutbreak.id, this.queryBuilder);
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
            this.casesListCount$ = this.caseDataService.getCasesCount(this.selectedOutbreak.id, countQueryBuilder);
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
<<<<<<< HEAD
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        return [
            'checkbox',
            'firstName',
            'lastName',
            'classification',
            'age',
            'gender',
            'dateOfOnset',
            'actions'
        ];
    }

    /**
=======
>>>>>>> 03c1ee3e70f1fa5b087b23275ed8adfa4a74ee5a
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
