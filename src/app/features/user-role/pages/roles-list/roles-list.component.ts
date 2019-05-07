import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { UserRoleModel } from '../../../../core/models/user-role.model';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { catchError, share, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';

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

    // authenticated user
    authUser: UserModel;
    // list of existing roles
    rolesList$: Observable<UserRoleModel[]>;
    // list of permission
    availablePermissions$: Observable<any>;

    recordActions: HoverRowAction[] = [
        // View Role
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_USER_ROLES_ACTION_VIEW_ROLE',
            click: (item: UserRoleModel) => {
                this.router.navigate(['/user-roles', item.id, 'view']);
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
                return this.hasUserRoletWriteAccess() &&
                    !this.authUser.hasRole(item.id);
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
                        return this.hasUserRoletWriteAccess() &&
                            !this.authUser.hasRole(item.id);
                    },
                    class: 'mat-menu-item-delete'
                })
            ]
        })
    ];

    constructor(
        private router: Router,
        private userRoleDataService: UserRoleDataService,
        private authDataService: AuthDataService,
        protected snackbarService: SnackbarService,
        private dialogService: DialogService
    ) {
        super(
            snackbarService
        );

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
    }

    ngOnInit() {
        this.availablePermissions$ = this.userRoleDataService.getAvailablePermissions().pipe(share());

        this.needsRefreshList(true);
    }

    /**
     * Re(load) the User Roles list
     */
    refreshList() {
        // get the list of existing roles
        this.rolesList$ = this.userRoleDataService.getRolesList(this.queryBuilder)
            .pipe(tap(this.checkEmptyList.bind(this)));
    }

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

    /**
     * Check if we have write access to user roles
     * @returns {boolean}
     */
    hasUserRoletWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_ROLE);
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        return [
            'name',
            'description',
            'permissions'
        ];
    }
}
