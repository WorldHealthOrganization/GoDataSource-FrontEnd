import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserModel, UserRoleModel, UserSettings } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { PermissionModel } from '../../../../core/models/permission.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { catchError, share, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { IBasicCount } from '../../../../core/models/basic-count.interface';

@Component({
    selector: 'app-roles-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './roles-list.component.html',
    styleUrls: ['./roles-list.component.less']
})
export class RolesListComponent extends ListComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Roles', '.', true)
    ];

    // constants
    PermissionModel = PermissionModel;
    UserSettings = UserSettings;
    UserRoleModel = UserRoleModel;

    // user list
    userList$: Observable<UserModel[]>;

    // authenticated user
    authUser: UserModel;
    // list of existing roles
    rolesList$: Observable<UserRoleModel[]>;
    rolesListCount$: Observable<IBasicCount>;
    // list of permission
    availablePermissions$: Observable<any>;

    recordActions: HoverRowAction[] = [
        // View Role
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_USER_ROLES_ACTION_VIEW_ROLE',
            click: (item: UserRoleModel) => {
                this.router.navigate(['/user-roles', item.id, 'view']);
            },
            visible: (item: UserRoleModel): boolean => {
                return UserRoleModel.canView(this.authUser);
            }
        }),

        // Modify Role
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_LIST_USER_ROLES_ACTION_MODIFY_ROLE',
            click: (item: UserRoleModel) => {
                this.router.navigate(['/user-roles', item.id, 'modify']);
            },
            visible: (item: UserRoleModel): boolean => {
                return !this.authUser.hasRole(item.id) &&
                    UserRoleModel.canModify(this.authUser);
            }
        }),

        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // Delete Role
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_USER_ROLES_ACTION_DELETE_ROLE',
                    click: (item: UserRoleModel) => {
                        this.deleteRole(item);
                    },
                    visible: (item: UserRoleModel): boolean => {
                        return !this.authUser.hasRole(item.id) &&
                            UserRoleModel.canDelete(this.authUser);
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
        private router: Router,
        private userRoleDataService: UserRoleDataService,
        private authDataService: AuthDataService,
        protected snackbarService: SnackbarService,
        private dialogService: DialogService,
        private userDataService: UserDataService
    ) {
        super(
            snackbarService
        );

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get data
        this.availablePermissions$ = this.userRoleDataService.getAvailablePermissions().pipe(share());
        this.userList$ = this.userDataService.getUsersListSorted().pipe(share());

        // initialize pagination
        this.initPaginator();
        // ...and re-load the list when the Selected Outbreak is changed
        this.needsRefreshList(true);

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
                field: 'name',
                label: 'LNG_USER_ROLE_FIELD_LABEL_NAME'
            }),
            new VisibleColumnModel({
                field: 'description',
                label: 'LNG_USER_ROLE_FIELD_LABEL_DESCRIPTION'
            }),
            new VisibleColumnModel({
                field: 'users',
                label: 'LNG_USER_ROLE_FIELD_LABEL_USERS'
            }),
            new VisibleColumnModel({
                field: 'permissions',
                label: 'LNG_USER_ROLE_FIELD_LABEL_PERMISSIONS'
            })
        ];
    }

    /**
     * Re(load) the User Roles list
     */
    refreshList(finishCallback: (records: any[]) => void) {
        // make sure we include user information
        this.queryBuilder.filter.flag(
            'includeUsers',
            true
        );

        // get the list of existing roles
        this.rolesList$ = this.userRoleDataService
            .getRolesList(this.queryBuilder)
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
        this.rolesListCount$ = this.userRoleDataService
            .getRolesCount(countQueryBuilder)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    return throwError(err);
                }),
                share()
            );
    }

    /**
     * Delete role
     */
    deleteRole(userRole: UserRoleModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_USER_ROLE', userRole)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete the role
                    this.userRoleDataService
                        .deleteRole(userRole.id)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err, {userRoleName : userRole.name});
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_USER_ROLES_ACTION_DELETE_USER_ROLE_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }
}
