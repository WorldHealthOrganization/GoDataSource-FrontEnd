import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { Observable } from 'rxjs/Observable';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { Constants } from '../../../../core/models/constants';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { DialogAnswerButton, DialogField, DialogFieldType, LoadingDialogModel, ModifyContactFollowUpQuestionnaireData, ModifyContactFollowUpQuestionnaireDialogComponent } from '../../../../shared/components';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { DialogAnswer, DialogConfiguration } from '../../../../shared/components/dialog/dialog.component';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import * as moment from 'moment';
import { AppliedFilterModel, FilterComparator, FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { Moment } from 'moment';
import { MatTable } from '@angular/material';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { NgModel } from '@angular/forms';
import * as FileSaver from 'file-saver';
import { Subscription } from 'rxjs/Subscription';
import { TeamModel } from '../../../../core/models/team.model';
import { tap } from 'rxjs/operators';

@Component({
    selector: 'app-daily-follow-ups-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contact-daily-follow-ups-list.component.html',
    styleUrls: ['./contact-daily-follow-ups-list.component.less']
})
export class ContactDailyFollowUpsListComponent extends ListComponent implements OnInit, OnDestroy {
    breadcrumbs: BreadcrumbItemModel[] = [];

    // import constants into template
    Constants = Constants;
    UserSettings = UserSettings;

    // authenticated user
    authUser: UserModel;
    // contacts outbreak
    selectedOutbreak: OutbreakModel;

    // follow ups list
    followUpsList$: Observable<FollowUpModel[]>;
    followUpsListCount$: Observable<any>;

    // yes / no / all options
    yesNoOptionsList$: Observable<any[]>;

    ReferenceDataCategory = ReferenceDataCategory;
    dailyStatusTypeOptions$: Observable<any[]>;

    availableSideFilters: FilterModel[];

    dateFilterDefaultValue: Moment;

    teamsList$: Observable<TeamModel[]>;
    teamsListLoaded: TeamModel[];
    teamsListLoadedForHeaderSearch: LabelValuePair[];
    teamIdFilterValue: string = 'all';

    // export Follow-ups
    exportFollowUpsUrl: string;
    followUpsDataExportFileName: string = moment().format('YYYY-MM-DD');
    allowedExportTypes: ExportDataExtension[] = [
        ExportDataExtension.CSV,
        ExportDataExtension.XML,
        ExportDataExtension.PDF
    ];
    anonymizeFields: LabelValuePair[] = [
        new LabelValuePair('LNG_FOLLOW_UP_FIELD_LABEL_ID', 'id'),
        new LabelValuePair('LNG_FOLLOW_UP_FIELD_LABEL_DATE', 'date'),
        new LabelValuePair('LNG_FOLLOW_UP_FIELD_LABEL_TARGETED', 'targeted'),
        new LabelValuePair('LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID', 'statusId'),
        new LabelValuePair('LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS', 'address'),
        new LabelValuePair('LNG_FOLLOW_UP_FIELD_LABEL_QUESTIONNAIRE_ANSWERS', 'questionnaireAnswers')
    ];

    caseId: string;
    caseData: CaseModel;

    contactId: string;
    contactData: ContactModel;

    loadingDialog: LoadingDialogModel;

    @ViewChild('followUpDate', {read: NgModel}) followUpDateElem: NgModel;

    // subscribers
    outbreakSubscriber: Subscription;

    constructor(
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private followUpsDataService: FollowUpsDataService,
        protected snackbarService: SnackbarService,
        private dialogService: DialogService,
        private genericDataService: GenericDataService,
        private router: Router,
        private i18nService: I18nService,
        private referenceDataDataService: ReferenceDataDataService,
        private teamDataService: TeamDataService,
        protected route: ActivatedRoute,
        private caseDataService: CaseDataService,
        private contactDataService: ContactDataService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        // add page title
        this.followUpsDataExportFileName = this.i18nService.instant('LNG_PAGE_LIST_FOLLOW_UPS_TITLE') +
            ' - ' +
            this.followUpsDataExportFileName;

        // daily status types
        this.dailyStatusTypeOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_DAILY_FOLLOW_UP_STATUS);

        // set default filter rules
        this.initializeHeaderFilters();

        // load teams list
        // using share does the job, but it takes a bit to see the changes in the list
        // loading an array is instantaneous
        this.teamsList$ = this.teamDataService.getTeamsList().share();
        this.teamsList$.subscribe((teamsList) => {
            // teams loaded used by quick team change
            this.teamsListLoaded = teamsList;

            // format search options
            this.teamsListLoadedForHeaderSearch = _.map(this.teamsListLoaded, (team: TeamModel) => {
                return new LabelValuePair(
                    team.name,
                    team.id
                );
            });

            // add all option
            this.teamsListLoadedForHeaderSearch = [
                new LabelValuePair(
                    'LNG_COMMON_LABEL_ALL',
                    this.teamIdFilterValue
                ),
                ...this.teamsListLoadedForHeaderSearch
            ];
        });

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();

        // get case id
        this.route.params
            .subscribe((params: { caseId, contactId }) => {
                // case Id arrives only from cases list, view & modify pages
                // coming directly to daily page doesn't provide us with a case id
                this.caseId = params.caseId;

                // contact Id arrives only from contacts list, view & modify pages
                // coming directly to daily page doesn't provide us with a contact id
                this.contactId = params.contactId;

                // no need to retrieve any data? then we can initialize breadcrumbs
                if (!this.caseId && !this.contactId) {
                    this.initializeBreadcrumbs();
                }

                // outbreak subscriber
                if (this.outbreakSubscriber) {
                    this.outbreakSubscriber.unsubscribe();
                    this.outbreakSubscriber = null;
                }

                // subscribe to the Selected Outbreak
                this.outbreakSubscriber = this.outbreakDataService
                    .getSelectedOutbreakSubject()
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        // selected outbreak
                        this.selectedOutbreak = selectedOutbreak;

                        // export url
                        this.exportFollowUpsUrl = null;

                        if (
                            this.selectedOutbreak &&
                            this.selectedOutbreak.id
                        ) {
                            this.exportFollowUpsUrl = `outbreaks/${this.selectedOutbreak.id}/follow-ups/export`;

                            // retrieve case data
                            if (this.caseId) {
                                this.retrieveCaseData();
                            }

                            // retrieve contact data
                            if (this.contactId) {
                                this.retrieveContactData();
                            }
                        }

                        // initialize pagination
                        this.initPaginator();
                        // ...and re-load the list when the Selected Outbreak is changed
                        this.needsRefreshList(true);
                    });
            });

        // initialize Side Table Columns
        this.initializeSideTableColumns();

        // initialize side filters
        this.initializeSideFilters();
    }

    ngOnDestroy() {
        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
    }

    /**
     * Download the Daily Follow-ups Form
     */
    downloadDailyFollowUpsForm() {
        if (this.selectedOutbreak) {
            if (
                this.followUpDateElem &&
                this.followUpDateElem.value
            ) {
                this.showLoadingDialog();
                const isoDate = this.followUpDateElem.value.toISOString();
                this.followUpsDataService.downloadDailyFollowUpsForm(this.selectedOutbreak.id, isoDate)
                    .subscribe((blob) => {
                        this.downloadFile(blob, 'LNG_PAGE_LIST_FOLLOW_UPS_PRINT_DAILY_FORM_FILE_NAME');
                        this.closeLoadingDialog();
                    });
            } else {
                // display select date data
                this.snackbarService.showError('LNG_PAGE_LIST_FOLLOW_UPS_PRINT_DAILY_FORM_NO_DATE_ERROR');
            }
        }
    }

    /**
     * Download File
     * @param blob
     * @param fileNameToken
     */
    private downloadFile(
        blob,
        fileNameToken,
        extension: string = 'pdf'
    ) {
        const fileName = this.i18nService.instant(fileNameToken);
        FileSaver.saveAs(
            blob,
            `${fileName}.${extension}`
        );
    }

    /**
     * Retrieve case data
     */
    retrieveCaseData() {
        // retrieve case data
        this.caseDataService
            .getCase(this.selectedOutbreak.id, this.caseId)
            .subscribe((caseData: CaseModel) => {
                this.caseData = caseData;
                this.initializeBreadcrumbs();
            });
    }

    /**
     * Retrieve contact data
     */
    retrieveContactData() {
        // retrieve case data
        this.contactDataService
            .getContact(this.selectedOutbreak.id, this.contactId)
            .subscribe((contactData: ContactModel) => {
                this.contactData = contactData;
                this.initializeBreadcrumbs();
            });
    }

    /**
     * Initialize breadcrumbs
     */
    initializeBreadcrumbs() {
        // init
        this.breadcrumbs = [];

        // add case / contact breadcrumbs
        if (!this.caseId) {
            this.breadcrumbs.push(new BreadcrumbItemModel(
                'LNG_PAGE_LIST_CONTACTS_TITLE',
                '/contacts'
            ));
        } else if (this.caseData) {
            this.breadcrumbs.push(new BreadcrumbItemModel(
                'LNG_PAGE_LIST_CASES_TITLE',
                '/cases'
            ));
            this.breadcrumbs.push(new BreadcrumbItemModel(
                this.caseData.name,
                `/cases/${this.caseData.id}/view`
            ));
        }

        // add contact data ?
        if (this.contactData) {
            this.breadcrumbs.push(new BreadcrumbItemModel(
                this.contactData.name,
                `/contacts/${this.contactData.id}/view`
            ));
        }

        // add follow-ups breadcrumbs
        this.breadcrumbs.push(new BreadcrumbItemModel(
            'LNG_PAGE_LIST_FOLLOW_UPS_TITLE',
            '.',
            true
        ));
    }

    /**
     * Initialize header filters
     */
    initializeHeaderFilters() {
        this.dateFilterDefaultValue = moment();
        this.queryBuilder.filter.byDateRange(
            'date', {
                startDate: moment(this.dateFilterDefaultValue).startOf('day'),
                endDate: moment(this.dateFilterDefaultValue).endOf('day')
            }
        );
    }

    /**
     * Add search criteria
     */
    resetFiltersAddDefault() {
        this.initializeHeaderFilters();
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
                field: 'contact.lastName',
                label: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT_LAST_NAME'
            }),
            new VisibleColumnModel({
                field: 'contact.firstName',
                label: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT_FIRST_NAME'
            }),
            new VisibleColumnModel({
                field: 'contact.dateOfLastContact',
                label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT'
            }),
            new VisibleColumnModel({
                field: 'area',
                label: 'LNG_FOLLOW_UP_FIELD_LABEL_AREA'
            }),
            new VisibleColumnModel({
                field: 'fullAddress',
                label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'team',
                label: 'LNG_FOLLOW_UP_FIELD_LABEL_TEAM',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'statusId',
                label: 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID'
            }),
            new VisibleColumnModel({
                field: 'deleted',
                label: 'LNG_FOLLOW_UP_FIELD_LABEL_DELETED',
                visible: false
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
        // filter options
        const genderOptionsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        const occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);
        const caseRiskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL);
        const caseClassificationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION);
        const yesNoOptionsWithoutAllList$ = this.genericDataService.getFilterYesNoOptions(true);
        const outcomeList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OUTCOME);

        // set available side filters
        // Follow-ups
        this.availableSideFilters = [
            new FilterModel({
                fieldName: 'address',
                fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS',
                type: FilterType.ADDRESS
            }),
            new FilterModel({
                fieldName: 'date',
                fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_DATE',
                type: FilterType.RANGE_DATE,
                value: {
                    startDate: moment(this.dateFilterDefaultValue).startOf('day').format(),
                    endDate: moment(this.dateFilterDefaultValue).endOf('day').format()
                }
            }),
            new FilterModel({
                fieldName: 'teamId',
                fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_TEAM',
                type: FilterType.MULTISELECT,
                options$: this.teamsList$,
                optionsLabelKey: 'name',
                optionsValueKey: 'id'
            }),
            new FilterModel({
                fieldName: 'targeted',
                fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED',
                type: FilterType.SELECT,
                options$: yesNoOptionsWithoutAllList$
            }),
            new FilterModel({
                fieldName: 'statusId',
                fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
                type: FilterType.SELECT,
                options$: this.dailyStatusTypeOptions$
            }),
            new FilterModel({
                fieldName: 'weekNumber',
                fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_WEEK_NUMBER',
                type: FilterType.NUMBER,
                allowedComparators: [
                    _.find(AppliedFilterModel.allowedComparators[FilterType.NUMBER], { value: FilterComparator.IS })
                ],
                flagIt: true
            }),
            new FilterModel({
                fieldName: 'timeLastSeen',
                fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_TIME_FILTER',
                type: FilterType.DATE,
                allowedComparators: [
                    _.find(AppliedFilterModel.allowedComparators[FilterType.DATE], { value: FilterComparator.IS })
                ],
                flagIt: true
            })
        ];

        // Contact
        if (this.authUser.hasPermissions(PERMISSION.READ_CONTACT)) {
            this.availableSideFilters = [
                ...this.availableSideFilters,
                ...[
                    new FilterModel({
                        fieldName: 'firstName',
                        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME',
                        type: FilterType.TEXT,
                        relationshipPath: ['contact'],
                        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
                    }),
                    new FilterModel({
                        fieldName: 'lastName',
                        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_LAST_NAME',
                        type: FilterType.TEXT,
                        relationshipPath: ['contact'],
                        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
                    }),
                    new FilterModel({
                        fieldName: 'addresses',
                        fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS',
                        type: FilterType.ADDRESS,
                        relationshipPath: ['contact'],
                        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
                    }),
                    new FilterModel({
                        fieldName: 'gender',
                        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_GENDER',
                        type: FilterType.MULTISELECT,
                        options$: genderOptionsList$,
                        relationshipPath: ['contact'],
                        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
                    }),
                    new FilterModel({
                        fieldName: 'age',
                        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_AGE',
                        type: FilterType.RANGE_AGE,
                        relationshipPath: ['contact'],
                        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
                    }),
                    new FilterModel({
                        fieldName: 'dob',
                        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_BIRTH',
                        type: FilterType.RANGE_DATE,
                        relationshipPath: ['contact'],
                        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
                    }),
                    new FilterModel({
                        fieldName: 'phone',
                        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_PHONE',
                        type: FilterType.TEXT,
                        relationshipPath: ['contact'],
                        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
                    }),
                    new FilterModel({
                        fieldName: 'occupation',
                        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_OCCUPATION',
                        type: FilterType.MULTISELECT,
                        options$: occupationsList$,
                        relationshipPath: ['contact'],
                        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
                    })
                ]
            ];
        }

        // Case
        if (this.authUser.hasPermissions(PERMISSION.READ_CASE)) {
            this.availableSideFilters = [
                ...this.availableSideFilters,
                ...[
                    new FilterModel({
                        fieldName: 'firstName',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
                        type: FilterType.TEXT,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'middleName',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME',
                        type: FilterType.TEXT,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'lastName',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
                        type: FilterType.TEXT,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'gender',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_GENDER',
                        type: FilterType.MULTISELECT,
                        options$: genderOptionsList$,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'phoneNumber',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_PHONE_NUMBER',
                        type: FilterType.TEXT,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'riskLevel',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_RISK_LEVEL',
                        type: FilterType.MULTISELECT,
                        options$: caseRiskLevelsList$,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'riskReason',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_RISK_REASON',
                        type: FilterType.TEXT,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'classification',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
                        type: FilterType.MULTISELECT,
                        options$: caseClassificationsList$,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'occupation',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_OCCUPATION',
                        type: FilterType.MULTISELECT,
                        options$: occupationsList$,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'age',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_AGE',
                        type: FilterType.RANGE_AGE,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'dob',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_DOB',
                        type: FilterType.RANGE_DATE,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'visualId',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_VISUAL_ID',
                        type: FilterType.TEXT,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'dateOfInfection',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION',
                        type: FilterType.RANGE_DATE,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'dateOfOnset',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET',
                        type: FilterType.RANGE_DATE,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'dateOfOutcome',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME',
                        type: FilterType.RANGE_DATE,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'dateBecomeCase',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE',
                        type: FilterType.RANGE_DATE,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'deceased',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_DECEASED',
                        type: FilterType.SELECT,
                        options$: yesNoOptionsWithoutAllList$,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'dateDeceased',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_DECEASED',
                        type: FilterType.RANGE_DATE,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'safeBurial',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_SAFETY_BURIAL',
                        type: FilterType.SELECT,
                        options$: yesNoOptionsWithoutAllList$,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'isDateOfOnsetApproximate',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_IS_DATE_OF_ONSET_APPROXIMATE',
                        type: FilterType.SELECT,
                        options$: yesNoOptionsWithoutAllList$,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'dateOfReporting',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING',
                        type: FilterType.RANGE_DATE,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'isDateOfReportingApproximate',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
                        type: FilterType.SELECT,
                        options$: yesNoOptionsWithoutAllList$,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'transferRefused',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED',
                        type: FilterType.SELECT,
                        options$: yesNoOptionsWithoutAllList$,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'outcomeId',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_OUTCOME',
                        type: FilterType.MULTISELECT,
                        options$: outcomeList$,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'wasContact',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT',
                        type: FilterType.SELECT,
                        options$: yesNoOptionsWithoutAllList$,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    }),
                    new FilterModel({
                        fieldName: 'addresses',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_ADDRESSES',
                        type: FilterType.ADDRESS,
                        relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
                        childQueryBuilderKey: 'case'
                    })
                ]
            ];
        }
    }

    /**
     * Refresh list
     */
    refreshList() {
        if (this.selectedOutbreak) {
            // add case id
            if (this.caseId) {
                this.queryBuilder.addChildQueryBuilder('case').filter.byEquality('id', this.caseId);
            }

            // add contact id
            if (this.contactId) {
                this.queryBuilder.filter.byEquality(
                    'personId',
                    this.contactId
                );
            }

            // retrieve the list of Follow Ups
            this.followUpsList$ = this.followUpsDataService
                .getFollowUpsList(this.selectedOutbreak.id, this.queryBuilder)
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
            this.followUpsListCount$ = this.followUpsDataService
                .getFollowUpsCount(this.selectedOutbreak.id, countQueryBuilder)
                .share();
        }
    }

    /**
     * Check if we have access to create / generate follow-ups
     * @returns {boolean}
     */
    hasFollowUpsWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_FOLLOWUP);
    }

    /**
     * Delete specific follow-up
     * @param {FollowUpModel} followUp
     */
    deleteFollowUp(followUp: FollowUpModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_FOLLOW_UP', new ContactModel(followUp.contact))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete follow up
                    this.followUpsDataService
                        .deleteFollowUp(this.selectedOutbreak.id, followUp.personId, followUp.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_DELETE_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Restore specific follow-up
     * @param {FollowUpModel} followUp
     */
    restoreFollowUp(followUp: FollowUpModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_RESTORE_FOLLOW_UP', new ContactModel(followUp.contact))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete follow up
                    this.followUpsDataService
                        .restoreFollowUp(this.selectedOutbreak.id, followUp.personId, followUp.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_RESTORE_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Generate Follow Ups
     */
    generateFollowUps() {
        if (this.selectedOutbreak) {
            this.genericDataService
                .getFilterYesNoOptions()
                .subscribe((yesNoOptions: LabelValuePair[]) => {
                    const yesNoOptionsFiltered: LabelValuePair[] = _.filter(yesNoOptions, (item: LabelValuePair) => _.isBoolean(item.value));
                    this.dialogService.showInput(new DialogConfiguration({
                        message: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_DIALOG_TITLE',
                        yesLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_DIALOG_YES_BUTTON',
                        fieldsList: [
                            new DialogField({
                                name: 'dates',
                                required: true,
                                value: {
                                    startDate: moment().add(1, 'days').startOf('day').format(),
                                    endDate: moment().add(1, 'days').endOf('day').format()
                                },
                                fieldType: DialogFieldType.DATE_RANGE
                            }),
                            new DialogField({
                                name: 'targeted',
                                placeholder: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_DIALOG_TARGETED_LABEL',
                                inputOptions: yesNoOptionsFiltered,
                                inputOptionsClearable: false,
                                required: true,
                                value: true
                            })
                        ]
                    })).subscribe((answer: DialogAnswer) => {
                        if (answer.button === DialogAnswerButton.Yes) {
                            this.followUpsDataService
                                .generateFollowUps(
                                    this.selectedOutbreak.id,
                                    answer.inputValue.value.dates.startDate,
                                    answer.inputValue.value.dates.endDate,
                                    answer.inputValue.value.targeted
                                ).catch((err) => {
                                    this.snackbarService.showError(err.message);
                                    return ErrorObservable.create(err);
                                })
                                .subscribe(() => {
                                    this.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_SUCCESS_MESSAGE');

                                    // reload data
                                    this.needsRefreshList(true);
                                });
                        }
                    });
                });
        }
    }

    /**
     * Modify selected follow-ups
     */
    modifySelectedFollowUps(table: MatTable<any>) {
        // get list of follow-ups that we want to modify
        const selectedRecords: false | string[] = this.validateCheckedRecords();
        if (!selectedRecords) {
            return;
        }

        // check if we have future records
        let hasFutureFollowUps: boolean = false;
        _.each(
            table.dataSource,
            (item: FollowUpModel) => {
                if (
                    selectedRecords.indexOf(item.id) > -1 &&
                    this.dateInTheFuture(item.date)
                ) {
                    // found record that is in the future
                    hasFutureFollowUps = true;

                    // stop each
                    return false;
                }
            }
        );

        // we aren't allowed to continue to modify follow-ups if in our list we have future follow-ups
        if (hasFutureFollowUps) {
            this.snackbarService.showError('LNG_PAGE_LIST_FOLLOW_UPS_MODIFY_FUTURE_FOLLOW_UPS');
            return;
        }

        // redirect to next step
        this.router.navigate(
            ['/contacts/follow-ups/modify-list'],
            {
                queryParams: {
                    followUpsIds: JSON.stringify(selectedRecords)
                }
            }
        );
    }

    /**
     * Export selected follow-ups
     */
    exportSelectedFollowUps() {
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
            message: 'LNG_PAGE_LIST_FOLLOW_UPS_EXPORT_TITLE',
            url: this.exportFollowUpsUrl,
            fileName: this.followUpsDataExportFileName,

            // // optional
            allowedExportTypes: this.allowedExportTypes,
            queryBuilder: qb,
            displayEncrypt: true,
            displayAnonymize: true,
            anonymizeFields: this.anonymizeFields,
            exportStart: () => { this.showLoadingDialog(); },
            exportFinished: () => { this.closeLoadingDialog(); }
        });
    }

    /**
     * Check if date is in future to know if we show "Missed to follow-up" option or not
     */
    dateInTheFuture(followUpDate): boolean {
        const date = followUpDate ? moment(followUpDate) : null;
        return !!(date && date.startOf('day').isAfter(Constants.getCurrentDate()));
    }

    /**
     * Modify follow-up questionnaire
     * @param followUp
     */
    modifyQuestionnaire(followUp: FollowUpModel) {
        this.dialogService.showCustomDialog(
            ModifyContactFollowUpQuestionnaireDialogComponent, {
                ...ModifyContactFollowUpQuestionnaireDialogComponent.DEFAULT_CONFIG,
                ...{
                    data: new ModifyContactFollowUpQuestionnaireData(
                        followUp,
                        this.selectedOutbreak
                    )
                }
            }
        ).subscribe(() => {
            // NOTHING TO DO HERE
            // not even to refresh list of follow-ups since we don't want to display this information, and it would be a waste of time to refresh the list, loose page etc...
        });
    }

    /**
     * Change FollowUp Team
     */
    changeFollowUpTeam(
        followUp: FollowUpModel,
        team: TeamModel
    ) {
        // modify follow-up
        this.followUpsDataService
            .modifyFollowUp(
                this.selectedOutbreak.id,
                followUp.personId,
                followUp.id, {
                    teamId: team ? team.id : null
                }
            ).catch((err) => {
                this.snackbarService.showApiError(err);
                return ErrorObservable.create(err);
            }).subscribe(() => {
                // update loaded follow-up data
                followUp.teamId = team.id;

                // show success ?
                // this might not be the best idea...maybe we can replace / remove it
                this.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_CHANGE_FOLLOW_UP_TEAM_SUCCESS_MESSAGE');
            });
    }

    /**
     * Filter by team
     */
    filterByTeam(data: LabelValuePair) {
        // nothing to retrieve ?
        if (!data) {
            // no team
            this.queryBuilder.filter.where({
                teamId: {
                    eq: null
                }
            });

            // refresh list
            this.needsRefreshList();
        } else {
            // retrieve everything?
            if (data.value === this.teamIdFilterValue) {
                this.filterBySelectField('teamId', []);
            } else {
                this.filterBySelectField('teamId', data);
            }
        }
    }

    /**
     * Display loading dialog
     */
    showLoadingDialog() {
        this.loadingDialog = this.dialogService.showLoadingDialog();
    }
    /**
     * Hide loading dialog
     */
    closeLoadingDialog() {
        if (this.loadingDialog) {
            this.loadingDialog.close();
            this.loadingDialog = null;
        }
    }
}
