import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { Observable, Subscription } from 'rxjs';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { Constants } from '../../../../core/models/constants';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogAnswerButton, DialogField, DialogFieldType, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { DialogAnswer, DialogConfiguration } from '../../../../shared/components/dialog/dialog.component';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import * as moment from 'moment';
import { Moment } from 'moment';
import { AppliedFilterModel, FilterComparator, FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { CaseModel } from '../../../../core/models/case.model';
import { NgModel } from '@angular/forms';
import { catchError, map, share, tap } from 'rxjs/operators';
import { CountedItemsListItem } from '../../../../shared/components/counted-items-list/counted-items-list.component';
import { FollowUpsListComponent } from '../../helper-classes/follow-ups-list-component';
import { FollowUpPage } from '../../typings/follow-up-page';
import { throwError } from 'rxjs';

@Component({
    selector: 'app-daily-follow-ups-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contact-daily-follow-ups-list.component.html',
    styleUrls: ['./contact-daily-follow-ups-list.component.less']
})
export class ContactDailyFollowUpsListComponent extends FollowUpsListComponent implements OnInit, OnDestroy {
    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;
    // contacts outbreak
    selectedOutbreak: OutbreakModel;

    // follow ups list
    followUpsList$: Observable<FollowUpModel[]>;
    followUpsListCount$: Observable<any>;

    // Daily follow ups grouped by teams
    countedFollowUpsGroupedByTeams$: Observable<any>;

    // dropdowns values
    yesNoOptionsList$: Observable<any[]>;
    dailyStatusTypeOptions$: Observable<any[]>;

    // provide constants to template
    Constants = Constants;
    UserSettings = UserSettings;
    ExportDataExtension = ExportDataExtension;
    ReferenceDataCategory = ReferenceDataCategory;

    availableSideFilters: FilterModel[];
    // values for side filter
    savedFiltersType = Constants.APP_PAGE.DAILY_FOLLOW_UPS.value;

    dateFilterDefaultValue: Moment;

    caseId: string;
    caseData: CaseModel;

    // which follow-ups list page are we visiting?
    rootPage: FollowUpPage = FollowUpPage.DAILY;

    @ViewChild('followUpDate', {read: NgModel}) followUpDateElem: NgModel;

    // subscribers
    outbreakSubscriber: Subscription;

    recordActions: HoverRowAction[] = [
        // View Follow-up
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_VIEW_FOLLOW_UP',
            click: (item: FollowUpModel) => {
                this.router.navigate(['/contacts', item.personId, 'follow-ups', item.id, 'view'], {
                    queryParams: {
                        rootPage: this.rootPage,
                        rootCaseId: this.caseId
                    }
                });
            },
            visible: (item: FollowUpModel): boolean => {
                return !item.deleted;
            }
        }),

        // Modify Follow-up
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_MODIFY_FOLLOW_UP',
            click: (item: FollowUpModel) => {
                this.router.navigate(['/contacts', item.personId, 'follow-ups', item.id, 'modify'], {
                    queryParams: {
                        rootPage: this.rootPage,
                        rootCaseId: this.caseId
                    }
                });
            },
            visible: (item: FollowUpModel): boolean => {
                return !item.deleted &&
                    this.authUser &&
                    this.selectedOutbreak &&
                    this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                    this.hasFollowUpsWriteAccess() &&
                    !Constants.isDateInTheFuture(item.date);
            }
        }),

        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // Modify follow-up questionnaire
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_MODIFY_QUESTIONNAIRE',
                    click: (item: FollowUpModel) => {
                        this.modifyQuestionnaire(item);
                    },
                    visible: (item: FollowUpModel): boolean => {
                        return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            this.hasFollowUpsWriteAccess() &&
                            !Constants.isDateInTheFuture(item.date);
                    }
                }),

                // Delete Follow-up
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_DELETE_FOLLOW_UP',
                    click: (item: FollowUpModel) => {
                        this.deleteFollowUp(item);
                    },
                    visible: (item: FollowUpModel): boolean => {
                        return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            this.hasFollowUpsWriteAccess();
                    },
                    class: 'mat-menu-item-delete'
                }),

                // Restore a deleted follow-up
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_RESTORE_FOLLOW_UP',
                    click: (item: FollowUpModel) => {
                        this.restoreFollowUp(item);
                    },
                    visible: (item: FollowUpModel): boolean => {
                        return item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            this.hasFollowUpsWriteAccess();
                    },
                    class: 'mat-menu-item-restore'
                })
            ]
        })
    ];

    constructor(
        protected snackbarService: SnackbarService,
        protected dialogService: DialogService,
        protected followUpsDataService: FollowUpsDataService,
        protected router: Router,
        protected i18nService: I18nService,
        protected teamDataService: TeamDataService,
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private route: ActivatedRoute,
        private caseDataService: CaseDataService
    ) {
        super(
            snackbarService, dialogService, followUpsDataService,
            router, i18nService, teamDataService
        );
    }

    ngOnInit() {
        super.ngOnInit();

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // dropdowns options
        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();
        this.dailyStatusTypeOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_DAILY_FOLLOW_UP_STATUS);

        // set default filter rules
        this.initializeHeaderFilters();

        this.route.params
            .subscribe((params: { caseId }) => {
                // case Id arrives only from cases list, view & modify pages
                // coming directly to daily page doesn't provide us with a case id
                this.caseId = params.caseId;

                // no need to retrieve any data? then we can initialize breadcrumbs
                if (!this.caseId) {
                    this.initializeBreadcrumbs();
                } else {
                    this.rootPage = FollowUpPage.CASE_RELATED;
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

                        // retrieve case data
                        if (this.caseId) {
                            this.retrieveCaseData();
                        }

                        // initialize print and export
                        this.initializeFollowUpsExport();
                        this.initializeFollowUpsPrint();

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
     * Retrieve case data
     */
    retrieveCaseData() {
        if (
            this.selectedOutbreak &&
            this.selectedOutbreak.id &&
            this.caseId
        ) {
            // retrieve case data
            this.caseDataService
                .getCase(this.selectedOutbreak.id, this.caseId)
                .subscribe((caseData: CaseModel) => {
                    this.caseData = caseData;
                    this.initializeBreadcrumbs();
                });
        }
    }

    /**
     * Initialize breadcrumbs
     */
    private initializeBreadcrumbs() {
        // add case / contact breadcrumbs
        if (!this.caseData) {
            this.breadcrumbs = [
                new BreadcrumbItemModel(
                    'LNG_PAGE_LIST_CONTACTS_TITLE',
                    '/contacts'
                ),
                new BreadcrumbItemModel(
                    'LNG_PAGE_LIST_FOLLOW_UPS_TITLE',
                    '.',
                    true
                )
            ];
        } else {
            this.breadcrumbs = [
                new BreadcrumbItemModel(
                    'LNG_PAGE_LIST_CASES_TITLE',
                    '/cases'
                ),
                new BreadcrumbItemModel(
                    this.caseData.name,
                    `/cases/${this.caseData.id}/view`
                ),
                new BreadcrumbItemModel(
                    'LNG_PAGE_LIST_FOLLOW_UPS_FOR_RELATED_CONTACTS_TITLE',
                    '.',
                    true
                )
            ];
        }
    }

    /**
     * Initialize Side Table Columns
     */
    private initializeSideTableColumns() {
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
                field: 'contact.visualId',
                label: 'LNG_CONTACT_FIELD_LABEL_VISUAL_ID'
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
                field: 'targeted',
                label: 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED'
            }),
            new VisibleColumnModel({
                field: 'contact.dateOfLastContact',
                label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT'
            }),
            new VisibleColumnModel({
                field: 'contact.followUp.endDate',
                label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_END_OF_FOLLOWUP'
            }),
            new VisibleColumnModel({
                field: 'index',
                label: 'LNG_CONTACT_FIELD_LABEL_DAY_OF_FOLLOWUP'
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
                field: 'deleted',
                label: 'LNG_FOLLOW_UP_FIELD_LABEL_DELETED',
                visible: false
            })
        ];
    }

    /**
     * Initialize Side Filters
     */
    private initializeSideFilters() {
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
                fieldName: 'index',
                fieldLabel: 'LNG_CONTACT_FIELD_LABEL_DAY_OF_FOLLOWUP',
                type: FilterType.NUMBER
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
                    _.find(AppliedFilterModel.allowedComparators[FilterType.NUMBER], {value: FilterComparator.IS})
                ],
                flagIt: true
            }),
            new FilterModel({
                fieldName: 'timeLastSeen',
                fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_TIME_FILTER',
                type: FilterType.DATE,
                allowedComparators: [
                    _.find(AppliedFilterModel.allowedComparators[FilterType.DATE], {value: FilterComparator.IS})
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
                        fieldName: 'visualId',
                        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_VISUAL_ID',
                        type: FilterType.TEXT,
                        relationshipPath: ['contact'],
                        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
                    }),
                    new FilterModel({
                        fieldName: 'addresses.phoneNumber',
                        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_PHONE_NUMBER',
                        type: FilterType.TEXT,
                        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT',
                        childQueryBuilderKey: 'contact'
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
                        fieldName: 'addresses.phoneNumber',
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
     * Initialize header filters
     */
    initializeHeaderFilters() {
        this.dateFilterDefaultValue = moment().startOf('day');
        this.filterByFollowUpDate(this.dateFilterDefaultValue);
    }

    /**
     * Add search criteria
     */
    resetFiltersAddDefault() {
        this.initializeHeaderFilters();
    }

    /**
     * Refresh list
     */
    refreshList(finishCallback: () => void) {
        if (this.selectedOutbreak) {
            // refresh badges
            this.getFollowUpsGroupedByTeams();

            // add case id
            if (this.caseId) {
                this.queryBuilder.addChildQueryBuilder('case').filter.byEquality('id', this.caseId);
            }

            // retrieve the list of Follow Ups
            this.followUpsList$ = this.followUpsDataService
                .getFollowUpsList(this.selectedOutbreak.id, this.queryBuilder)
                .pipe(
                    map((followUps: FollowUpModel[]) => {
                        return FollowUpModel.determineAlertness(
                            this.selectedOutbreak.contactFollowUpTemplate,
                            followUps
                        );
                    }),
                    tap(this.checkEmptyList.bind(this)),
                    tap(() => {
                        finishCallback();
                    })
                );
        } else {
            finishCallback();
        }
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        if (this.selectedOutbreak) {
            // include related people in response
            const qb = new RequestQueryBuilder();
            qb.merge(this.queryBuilder);

            // add case id
            if (this.caseId) {
                qb.addChildQueryBuilder('case').filter.byEquality('id', this.caseId);
            }

            // remove paginator from query builder
            const countQueryBuilder = _.cloneDeep(qb);
            countQueryBuilder.paginator.clear();
            countQueryBuilder.sort.clear();
            this.followUpsListCount$ = this.followUpsDataService
                .getFollowUpsCount(this.selectedOutbreak.id, countQueryBuilder)
                .pipe(
                    share()
                );
        }
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
                    }))
                        .subscribe((answer: DialogAnswer) => {
                            if (answer.button === DialogAnswerButton.Yes) {
                                this.followUpsDataService
                                    .generateFollowUps(
                                        this.selectedOutbreak.id,
                                        answer.inputValue.value.dates.startDate,
                                        answer.inputValue.value.dates.endDate,
                                        answer.inputValue.value.targeted
                                    )
                                    .pipe(
                                        catchError((err) => {
                                            this.snackbarService.showApiError(err);
                                            return throwError(err);
                                        })
                                    )
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
     * Filter by follow-up date
     * @param value
     */
    filterByFollowUpDate(value: Moment) {
        // send filter further
        this.filterByDateField('date', value);

        // refresh dialog fields
        this.genericDataService
            .getRangeFollowUpGroupByOptions(true)
            .subscribe((options) => {
                this.printFollowUpsDialogExtraAPIData = {
                    date: {
                        startDate: moment(value).startOf('day'),
                        endDate: moment(value).endOf('day')
                    }
                };
                this.printFollowUpsDialogFields = [
                    new DialogField({
                        name: 'groupBy',
                        placeholder: 'LNG_PAGE_LIST_FOLLOW_UPS_EXPORT_GROUP_BY_BUTTON',
                        inputOptions: options,
                        value: Constants.RANGE_FOLLOW_UP_EXPORT_GROUP_BY.PLACE.value,
                        required: true
                    })
                ];
            });
    }

    /**
     * Get followUps grouped by teams
     */
    getFollowUpsGroupedByTeams() {
        if (this.selectedOutbreak) {
            this.countedFollowUpsGroupedByTeams$ = this.followUpsDataService
                .getCountedFollowUpsGroupedByTeams(this.selectedOutbreak.id, this.queryBuilder)
                .pipe(
                    map((data) => {
                        return _.map(data.team, (teamData) => {
                            return new CountedItemsListItem(
                                teamData.count ? teamData.count : 0,
                                teamData.team ? teamData.team.name : '',
                                teamData.team ? teamData.team.id : []
                            );
                        });
                    })
                );
        }
    }
}
