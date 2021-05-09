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
import { catchError, map, share, tap } from 'rxjs/operators';
import { FollowUpsListComponent } from '../../helper-classes/follow-ups-list-component';
import { DialogField, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { FollowUpPage } from '../../typings/follow-up-page';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { throwError } from 'rxjs/internal/observable/throwError';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { CaseModel } from '../../../../core/models/case.model';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { AddressModel } from '../../../../core/models/address.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';

@Component({
    selector: 'app-individual-contact-follow-ups-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './individual-contact-follow-ups-list.component.html',
    styleUrls: ['./individual-contact-follow-ups-list.component.less']
})
export class IndividualContactFollowUpsListComponent extends FollowUpsListComponent implements OnInit, OnDestroy {
    // needed for case/contact questionnaire history
    history: boolean = false;

    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;
    // contacts outbreak
    selectedOutbreak: OutbreakModel;

    // address model needed for filters
    filterAddressModel: AddressModel = new AddressModel({
        geoLocationAccurate: null
    });
    filterAddressParentLocationIds: string[] = [];

    // user list
    userList$: Observable<UserModel[]>;

    // follow ups list
    followUpsList$: Observable<FollowUpModel[]>;
    followUpsListCount$: Observable<IBasicCount>;

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
    FollowUpModel = FollowUpModel;

    recordId: string;
    recordData: ContactModel | CaseModel;
    isContact: boolean = true;

    // which follow-ups list page are we visiting?
    rootPage: FollowUpPage = FollowUpPage.FOR_CONTACT;

    // subscribers
    outbreakSubscriber: Subscription;

    recordActions: HoverRowAction[] = [
        // View Follow-up
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_VIEW_FOLLOW_UP',
            linkGenerator: (item: FollowUpModel): string[] => {
                return ['/contacts', item.personId, 'follow-ups', item.id, 'view'];
            },
            queryParamsGenerator: (): {
                [k: string]: any;
            } => {
                return  {
                    rootPage: this.rootPage
                };
            },
            visible: (item: FollowUpModel): boolean => {
                return !item.deleted &&
                    FollowUpModel.canView(this.authUser);
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
                return !this.history &&
                    !item.deleted &&
                    this.authUser &&
                    this.selectedOutbreak &&
                    this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                    FollowUpModel.canModify(this.authUser);
            }
        }),

        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // Delete Follow-up
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_DELETE_FOLLOW_UP',
                    click: (item: FollowUpModel) => {
                        this.deleteFollowUp(item);
                    },
                    visible: (item: FollowUpModel): boolean => {
                        return !this.history &&
                            !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            FollowUpModel.canDelete(this.authUser);
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
                        return !this.history &&
                            item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            FollowUpModel.canRestore(this.authUser);
                    },
                    class: 'mat-menu-item-restore'
                }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER,
                    visible: (item: FollowUpModel): boolean => {
                        // visible only if at least one of the previous...
                        return !this.history &&
                            !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            FollowUpModel.canModify(this.authUser) &&
                            !Constants.isDateInTheFuture(item.date);
                    }
                }),

                // Modify follow-up questionnaire
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_MODIFY_QUESTIONNAIRE',
                    click: (item: FollowUpModel) => {
                        this.modifyQuestionnaire(item);
                    },
                    visible: (item: FollowUpModel): boolean => {
                        return !this.history &&
                            !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            FollowUpModel.canModify(this.authUser) &&
                            !Constants.isDateInTheFuture(item.date);
                    }
                })
            ]
        })
    ];

    /**
     * Constructor
     */
    constructor(
        protected listHelperService: ListHelperService,
        protected dialogService: DialogService,
        protected followUpsDataService: FollowUpsDataService,
        protected router: Router,
        protected i18nService: I18nService,
        protected teamDataService: TeamDataService,
        protected outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private authDataService: AuthDataService,
        private genericDataService: GenericDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private route: ActivatedRoute,
        private contactDataService: ContactDataService,
        private caseDataService: CaseDataService,
        private userDataService: UserDataService
    ) {
        super(
            listHelperService, dialogService, followUpsDataService,
            router, i18nService, teamDataService, outbreakDataService
        );
    }

    /**
     * Component initialized
     */
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
            .subscribe((params: { contactId, caseId }) => {
                // check model
                if (params.contactId) {
                    this.recordId = params.contactId;
                } else {
                    this.recordId = params.caseId;
                    this.isContact = false;
                    this.history = true;
                    this.rootPage = FollowUpPage.FOR_CASE;
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

                        // initialize side filters
                        this.initializeSideFilters();

                        // retrieve contact/case data
                        this.retrieveData();

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

    /**
     * Component destroyed
     */
    ngOnDestroy() {
        // release parent resources
        super.ngOnDestroy();

        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
    }

    /**
     * Retrieve contact/case data
     */
    retrieveData() {
        if (
            this.selectedOutbreak &&
            this.selectedOutbreak.id &&
            this.recordId
        ) {
            // get data
            let entityData$;
            if (this.isContact) {
                entityData$ = this.contactDataService.getContact(this.selectedOutbreak.id, this.recordId);
            } else {
                entityData$ = this.caseDataService.getCase(this.selectedOutbreak.id, this.recordId);
            }

            if (entityData$) {
                entityData$.subscribe((recordData: ContactModel | CaseModel) => {
                    this.recordData = recordData;

                    // initialize print options
                    this.printFollowUpsDialogFields = [
                        new DialogField({
                            name: 'contactId',
                            placeholder: 'LNG_PAGE_LIST_FOLLOW_UPS_EXPORT_CONTACT_BUTTON',
                            inputOptions: [({
                                label: recordData.name,
                                value: this.recordId
                            }) as any],
                            value: this.recordId,
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
    }

    /**
     * Initialize breadcrumbs
     */
    private initializeBreadcrumbs() {
        // init
        this.breadcrumbs = [];

        // add contact/case breadcrumbs
        if (this.isContact) {
            if (ContactModel.canList(this.authUser)) {
                this.breadcrumbs.push(new BreadcrumbItemModel(
                    'LNG_PAGE_LIST_CONTACTS_TITLE',
                    '/contacts'
                ));
            }
        } else {
            if (CaseModel.canList(this.authUser)) {
                this.breadcrumbs.push(new BreadcrumbItemModel(
                    'LNG_PAGE_LIST_CASES_TITLE',
                    '/cases'
                ));
            }
        }

        // add record data ?
        if (
            this.recordData &&
            CaseModel.canView(this.authUser)
        ) {
            this.breadcrumbs.push(new BreadcrumbItemModel(
                this.recordData.name,
                this.isContact ? `/contacts/${this.recordData.id}/view` : `/cases/${this.recordData.id}/view`
            ));
        }

        // add follow-ups breadcrumbs
        this.breadcrumbs.push(new BreadcrumbItemModel(
            history ? 'LNG_PAGE_LIST_FOLLOW_UPS_REGISTERED_AS_CONTACT_TITLE' : 'LNG_PAGE_LIST_FOLLOW_UPS_TITLE',
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
                field: 'phoneNumber',
                label: 'LNG_FOLLOW_UP_FIELD_LABEL_PHONE_NUMBER'
            }),
            new VisibleColumnModel({
                field: 'address.emailAddress',
                label: 'LNG_FOLLOW_UP_FIELD_LABEL_EMAIL',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'address.addressLine1',
                label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'address.city',
                label: 'LNG_ADDRESS_FIELD_LABEL_CITY',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'address.geoLocation.lat',
                label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LAT',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'address.geoLocation.lng',
                label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LNG',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'address.postalCode',
                label: 'LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'address.geoLocationAccurate',
                label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_GEO_LOCATION_ACCURATE',
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
    refreshList(finishCallback: (records: any[]) => void) {
        if (
            this.selectedOutbreak &&
            this.recordId
        ) {
            // add contact id
            this.queryBuilder.filter.byEquality(
                'personId',
                this.recordId
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
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        finishCallback([]);
                        return throwError(err);
                    }),
                    map((followUps: FollowUpModel[]) => {
                        return FollowUpModel.determineAlertness(
                            this.selectedOutbreak.contactFollowUpTemplate,
                            followUps
                        );
                    }),
                    tap(this.checkEmptyList.bind(this)),
                    tap((data: any[]) => {
                        finishCallback(data);
                    })
                );
        } else {
            finishCallback([]);
        }
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        if (
            this.selectedOutbreak &&
            this.recordId
        ) {
            // include related people in response
            const qb = new RequestQueryBuilder();
            qb.merge(this.queryBuilder);

            // add contact id
            qb.filter.byEquality(
                'personId',
                this.recordId
            );

            // remove paginator from query builder
            const countQueryBuilder = _.cloneDeep(qb);
            countQueryBuilder.paginator.clear();
            countQueryBuilder.sort.clear();
            this.followUpsListCount$ = this.followUpsDataService
                .getFollowUpsCount(this.selectedOutbreak.id, countQueryBuilder)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        return throwError(err);
                    }),
                    share()
                );
        }
    }
}
