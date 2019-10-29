import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { Observable, Subscription } from 'rxjs';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { Constants } from '../../../../core/models/constants';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { AppliedFilterModel, FilterComparator, FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { RequestQueryBuilder, RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { map, share, tap } from 'rxjs/operators';
import { FollowUpsListComponent } from '../../helper-classes/follow-ups-list-component';
import { DialogField, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { FollowUpPage } from '../../typings/follow-up-page';
import { UserDataService } from '../../../../core/services/data/user.data.service';

@Component({
    selector: 'app-individual-contact-follow-ups-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './individual-contact-follow-ups-list.component.html',
    styleUrls: ['./individual-contact-follow-ups-list.component.less']
})
export class IndividualContactFollowUpsListComponent extends FollowUpsListComponent implements OnInit, OnDestroy {
    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;
    // contacts outbreak
    selectedOutbreak: OutbreakModel;

    // user list
    userList$: Observable<UserModel[]>;

    // follow ups list
    followUpsList$: Observable<FollowUpModel[]>;
    followUpsListCount$: Observable<any>;

    // dropdowns values
    yesNoOptionsList$: Observable<any[]>;
    yesNoOptionsWithoutAllList$: Observable<any[]>;
    dailyStatusTypeOptions$: Observable<any[]>;

    availableSideFilters: FilterModel[];

    // values for side filter
    savedFiltersType = Constants.APP_PAGE.INDIVIDUAL_CONTACT_FOLLOW_UPS.value;

    // provide constants to template
    Constants = Constants;
    UserSettings = UserSettings;
    ExportDataExtension = ExportDataExtension;
    ReferenceDataCategory = ReferenceDataCategory;

    contactId: string;
    contactData: ContactModel;

    // which follow-ups list page are we visiting?
    rootPage: FollowUpPage = FollowUpPage.FOR_CONTACT;

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
                        rootPage: this.rootPage
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
                        rootPage: this.rootPage
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
        private contactDataService: ContactDataService,
        private userDataService: UserDataService
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

        // retrieve users
        this.userList$ = this.userDataService.getUsersListSorted().pipe(share());

        // dropdowns options
        this.dailyStatusTypeOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_DAILY_FOLLOW_UP_STATUS);
        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();

        // filter options
        this.yesNoOptionsWithoutAllList$ = this.genericDataService.getFilterYesNoOptions(true);

        this.route.params
            .subscribe((params: { contactId }) => {
                this.contactId = params.contactId;

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

                        // initialize side filters
                        this.initializeSideFilters();

                        // retrieve contact data
                        this.retrieveContactData();

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
    }

    ngOnDestroy() {
        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
    }

    /**
     * Retrieve contact data
     */
    retrieveContactData() {
        if (
            this.selectedOutbreak &&
            this.selectedOutbreak.id &&
            this.contactId
        ) {
            // retrieve contact data
            this.contactDataService
                .getContact(this.selectedOutbreak.id, this.contactId)
                .subscribe((contactData: ContactModel) => {
                    this.contactData = contactData;

                    // initialize print options
                    this.printFollowUpsDialogFields = [
                        new DialogField({
                            name: 'contactId',
                            placeholder: 'LNG_PAGE_LIST_FOLLOW_UPS_EXPORT_CONTACT_BUTTON',
                            inputOptions: [({
                                label: contactData.name,
                                value: this.contactId
                            }) as any],
                            value: this.contactId,
                            required: true,
                            disabled: true
                        }),
                        new DialogField({
                            name: 'groupBy',
                            placeholder: 'LNG_PAGE_LIST_FOLLOW_UPS_EXPORT_GROUP_BY_BUTTON',
                            inputOptions: [(Constants.RANGE_FOLLOW_UP_EXPORT_GROUP_BY.PLACE) as any],
                            value: Constants.RANGE_FOLLOW_UP_EXPORT_GROUP_BY.PLACE.value,
                            required: true,
                            disabled: true
                        })
                    ];

                    // initialize breadcrumbs
                    this.initializeBreadcrumbs();
                });
        }
    }

    /**
     * Initialize breadcrumbs
     */
    private initializeBreadcrumbs() {
        // init
        this.breadcrumbs = [];

        // add contact breadcrumbs
        this.breadcrumbs.push(new BreadcrumbItemModel(
            'LNG_PAGE_LIST_CONTACTS_TITLE',
            '/contacts'
        ));

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
                field: 'date',
                label: 'LNG_FOLLOW_UP_FIELD_LABEL_DATE'
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
            }),
            new VisibleColumnModel({
                field: 'createdBy',
                label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_BY',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'createdAt',
                label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_AT',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'updatedBy',
                label: 'LNG_FOLLOW_UP_FIELD_LABEL_UPDATED_BY',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'updatedAt',
                label: 'LNG_FOLLOW_UP_FIELD_LABEL_UPDATED_AT',
                visible: false
            })
        ];
    }

    /**
     * Initialize Side Filters
     */
    private initializeSideFilters() {
        // if there is no outbreak, we can't fully initialize side filters
        if (
            !this.selectedOutbreak ||
            !this.selectedOutbreak.id
        ) {
            return;
        }

        // set available side filters
        // Follow-ups
        this.availableSideFilters = [
            new FilterModel({
                fieldName: 'address',
                fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS',
                type: FilterType.ADDRESS,
                addressFieldIsArray: false
            }),
            new FilterModel({
                fieldName: 'date',
                fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_DATE',
                type: FilterType.RANGE_DATE
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
                options$: this.yesNoOptionsWithoutAllList$
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
            }),
            new FilterModel({
                fieldName: 'questionnaireAnswers',
                fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
                type: FilterType.QUESTIONNAIRE_ANSWERS,
                questionnaireTemplate: this.selectedOutbreak.contactFollowUpTemplate
            })
        ];
    }

    /**
     * Refresh list
     */
    refreshList(finishCallback: () => void) {
        if (
            this.selectedOutbreak &&
            this.contactId
        ) {
            // add contact id
            this.queryBuilder.filter.byEquality(
                'personId',
                this.contactId
            );

            // make sure we always sort by something
            // default by date asc
            if (this.queryBuilder.sort.isEmpty()) {
                this.queryBuilder.sort.by(
                    'date',
                    RequestSortDirection.ASC
                );
            }

            // retrieve created user & modified user information
            this.queryBuilder.include('createdByUser', true);
            this.queryBuilder.include('updatedByUser', true);

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
        if (
            this.selectedOutbreak &&
            this.contactId
        ) {
            // include related people in response
            const qb = new RequestQueryBuilder();
            qb.merge(this.queryBuilder);

            // add contact id
            qb.filter.byEquality(
                'personId',
                this.contactId
            );

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
}
