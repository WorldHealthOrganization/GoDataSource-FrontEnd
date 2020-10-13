import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserModel, UserRoleModel, PhoneNumberType, UserSettings } from '../../../../core/models/user.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import * as _ from 'lodash';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { catchError, share, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { TeamModel } from '../../../../core/models/team.model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';

@Component({
    selector: 'app-user-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.less']
})
export class UserListComponent extends ListComponent implements OnInit, OnDestroy {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_USERS_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    // constants
    UserModel = UserModel;
    PhoneNumberType = PhoneNumberType;
    UserSettings = UserSettings;

    // list of existing users
    userTeamMap: {
        [userId: string]: TeamModel[]
    } = {};
    usersList$: Observable<UserModel[]>;
    usersListCount$: Observable<IBasicCount>;
    teamsList$: Observable<TeamModel[]>;

    rolesList$: Observable<UserRoleModel[]>;
    outbreaksListMap: any = {};
    outbreaksList$: Observable<OutbreakModel[]>;
    institutionsList$: Observable<LabelValuePair[]>;

    recordActions: HoverRowAction[] = [
        // View User
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_USERS_ACTION_VIEW_USER',
            click: (item: UserModel) => {
                this.router.navigate(['/users', item.id, 'view']);
            },
            visible: (item: UserModel): boolean => {
                return item.id !== this.authUser.id &&
                    UserModel.canView(this.authUser);
            }
        }),

        // Modify User
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_LIST_USERS_ACTION_MODIFY_USER',
            click: (item: UserModel) => {
                this.router.navigate(['/users', item.id, 'modify']);
            },
            visible: (item: UserModel): boolean => {
                return item.id !== this.authUser.id &&
                    UserModel.canModify(this.authUser);
            }
        }),

        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // Delete User
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_USERS_ACTION_DELETE_USER',
                    click: (item: UserModel) => {
                        this.deleteUser(item);
                    },
                    visible: (item: UserModel): boolean => {
                        return item.id !== this.authUser.id &&
                            UserModel.canDelete(this.authUser);
                    },
                    class: 'mat-menu-item-delete'
                })
            ]
        })
    ];

    /**
     * Constructor
     */
    constructor(
        protected listHelperService: ListHelperService,
        private router: Router,
        private userDataService: UserDataService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService,
        private outbreakDataService: OutbreakDataService,
        private userRoleDataService: UserRoleDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private teamDataService: TeamDataService
    ) {
        super(listHelperService);
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
        this.rolesList$ = this.userRoleDataService.getRolesList();

        this.institutionsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.INSTITUTION_NAME);

        this.outbreaksList$ = this.outbreakDataService
            .getOutbreaksListReduced()
            .pipe(
                tap((outbreaks) => {
                    (outbreaks || []).forEach((outbreak) => {
                        this.outbreaksListMap[outbreak.id] = outbreak;
                    });
                }),

                // share
                share()
            );

        // initialize pagination
        this.initPaginator();
        // ...and load the list of items
        this.needsRefreshList(true);

        // initialize Side Table Columns
        this.initializeSideTableColumns();

        // retrieve teams
        if (TeamModel.canList(this.authUser)) {
            this.retrieveTeams();
        }
    }

    /**
     * Release resources
     */
    ngOnDestroy() {
        // release parent resources
        super.ngOnDestroy();
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'lastName',
                label: 'LNG_USER_FIELD_LABEL_LAST_NAME'
            }),
            new VisibleColumnModel({
                field: 'firstName',
                label: 'LNG_USER_FIELD_LABEL_FIRST_NAME'
            }),
            new VisibleColumnModel({
                field: 'email',
                label: 'LNG_USER_FIELD_LABEL_EMAIL'
            }),
            new VisibleColumnModel({
                field: 'institutionName',
                label: 'LNG_USER_FIELD_LABEL_INSTITUTION_NAME'
            }),
            new VisibleColumnModel({
                field: 'telephoneNumbers',
                label: 'LNG_USER_FIELD_LABEL_TELEPHONE_NUMBERS'
            }),
            new VisibleColumnModel({
                field: 'role',
                label: 'LNG_USER_FIELD_LABEL_ROLES'
            }),
            new VisibleColumnModel({
                field: 'activeOutbreak',
                label: 'LNG_USER_FIELD_LABEL_ACTIVE_OUTBREAK'
            }),
            new VisibleColumnModel({
                field: 'availableOutbreaks',
                label: 'LNG_USER_FIELD_LABEL_AVAILABLE_OUTBREAKS'
            })
        ];

        // can see teams ?
        if (TeamModel.canList(this.authUser)) {
            this.tableColumns.push(new VisibleColumnModel({
                field: 'teams',
                label: 'LNG_USER_FIELD_LABEL_TEAMS'
            }));
        }
    }

    /**
     * Re(load) the Users list
     */
    refreshList(finishCallback: (records: any[]) => void) {
        // get the list of existing users
        this.usersList$ = this.userDataService
            .getUsersList(this.queryBuilder)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    finishCallback([]);
                    return throwError(err);
                }),
                tap(this.checkEmptyList.bind(this)),
                tap((data: any[]) => {
                    finishCallback(data);
                })
            );
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        // remove paginator from query builder
        const countQueryBuilder = _.cloneDeep(this.queryBuilder);
        countQueryBuilder.paginator.clear();
        countQueryBuilder.sort.clear();
        this.usersListCount$ = this.userDataService
            .getUsersCount(countQueryBuilder)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    return throwError(err);
                }),
                share()
            );
    }

    deleteUser(user: UserModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_USER', user)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete the user
                    this.userDataService
                        .deleteUser(user.id)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_USERS_ACTION_DELETE_USER_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Retrieve teams
     */
    retrieveTeams(): void {
        // retrieve teams
        const qb = new RequestQueryBuilder();
        qb.fields(
            'id',
            'name',
            'userIds'
        );
        this.teamsList$ = this.teamDataService
            .getTeamsList(qb)
            .pipe(
                tap((teams) => {
                    // go through each team and determine users
                    this.userTeamMap = {};
                    teams.forEach((team) => {
                        // no need to continue ?
                        // no really necessary since we do the above filter
                        if (
                            !team.userIds ||
                            team.userIds.length < 1
                        ) {
                            return;
                        }

                        // go through users
                        team.userIds.forEach((userId) => {
                            // init array ?
                            if (!this.userTeamMap[userId]) {
                                this.userTeamMap[userId] = [];
                            }

                            // push team
                            this.userTeamMap[userId].push(team);
                        });
                    });
                })
            );
    }

    /**
     * Filter by team
     */
    filterTeamField(teams: TeamModel[]): void {
        // determine list of users that we need to retrieve
        const usersToRetrieve: {
            [idUser: string]: true
        } = {};
        if (teams) {
            teams.forEach((team) => {
                (team.userIds || []).forEach((userId) => {
                    usersToRetrieve[userId] = true;
                });
            });
        }

        // filter
        this.filterBySelectField(
            'id',
            Object.keys(usersToRetrieve),
            null
        );
    }
}
