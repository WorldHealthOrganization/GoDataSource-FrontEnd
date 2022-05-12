import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import * as _ from 'lodash';
import { Observable, throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { UserModel, UserRoleModel } from '../../../../core/models/user.model';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { PermissionModel } from '../../../../core/models/permission.model';

@Component({
  selector: 'app-roles-list',
  templateUrl: './roles-list.component.html'
})
export class RolesListComponent extends ListComponent implements OnDestroy {
  // list of existing roles
  rolesList$: Observable<UserRoleModel[]>;

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private userRoleDataService: UserRoleDataService,
    private toastV2Service: ToastV2Service,
    private activatedRoute: ActivatedRoute,
    private dialogV2Service: DialogV2Service,
    private i18nService: I18nService
  ) {
    super(listHelperService);
  }

  /**
     * Release resources
     */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
  }

  /**
   * Component initialized
   */
  initialized(): void {
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns() {
    // default table columns
    this.tableColumns = [
      {
        field: 'name',
        label: 'LNG_USER_ROLE_FIELD_LABEL_NAME',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'description',
        label: 'LNG_USER_ROLE_FIELD_LABEL_DESCRIPTION',
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'users._id',
        label: 'LNG_USER_ROLE_FIELD_LABEL_USERS',
        format: {
          type: V2ColumnFormat.LINK_LIST
        },
        links: (item: UserRoleModel) => item.users?.length > 0 ?
          item.users.map((user) => {
            return {
              label: user.name,
              href: UserModel.canView(this.authUser) ?
                `/users/${ user.id }/view` :
                null
            };
          }) :
          [],
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
        }
      },
      {
        field: 'permissionIds',
        label: 'LNG_USER_ROLE_FIELD_LABEL_PERMISSIONS',
        format: {
          type: V2ColumnFormat.LINK_LIST
        },
        links: (item: UserRoleModel) => item.permissions?.length > 0 ?
          item.permissions.map((permission) => {
            return {
              label: this.i18nService.instant(permission.label),
              href: null
            };
          }) :
          [],
        filter: {
          type: V2FilterType.SELECT_GROUPS,
          groups: this.activatedRoute.snapshot.data.permission,
          groupLabelKey: 'groupLabel',
          groupTooltipKey: 'groupDescription',
          groupValueKey: 'groupAllId',
          groupOptionsKey: 'permissions',
          groupOptionLabelKey: 'label',
          groupOptionValueKey: 'id',
          groupOptionTooltipKey: 'description',
          groupAllLabel: 'LNG_ROLE_AVAILABLE_PERMISSIONS_GROUP_ALL',
          groupAllTooltip: 'LNG_ROLE_AVAILABLE_PERMISSIONS_GROUP_ALL_DESCRIPTION',
          groupNoneLabel: 'LNG_ROLE_AVAILABLE_PERMISSIONS_GROUP_NONE',
          groupNoneTooltip: 'LNG_ROLE_AVAILABLE_PERMISSIONS_GROUP_NONE_DESCRIPTION',
          groupPartialLabel: 'LNG_ROLE_AVAILABLE_PERMISSIONS_GROUP_PARTIAL',
          groupPartialTooltip: 'LNG_ROLE_AVAILABLE_PERMISSIONS_GROUP_PARTIAL_DESCRIPTION',
          groupOptionHiddenKey: 'hidden',
          defaultValues: PermissionModel.HIDDEN_PERMISSIONS
        }
      },

      // actions
      {
        field: 'actions',
        label: 'LNG_COMMON_LABEL_ACTIONS',
        pinned: IV2ColumnPinned.RIGHT,
        notResizable: true,
        cssCellClass: 'gd-cell-no-focus',
        format: {
          type: V2ColumnFormat.ACTIONS
        },
        actions: [
          // View Role
          {
            type: V2ActionType.ICON,
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_USER_ROLES_ACTION_VIEW_ROLE',
            action: {
              link: (item: UserRoleModel): string[] => {
                return ['/user-roles', item.id, 'view'];
              }
            },
            visible: (): boolean => {
              return UserRoleModel.canView(this.authUser);
            }
          },

          // Modify Role
          {
            type: V2ActionType.ICON,
            icon: 'edit',
            iconTooltip: 'LNG_PAGE_LIST_USER_ROLES_ACTION_MODIFY_ROLE',
            action: {
              link: (item: UserRoleModel): string[] => {
                return ['/user-roles', item.id, 'modify'];
              }
            },
            visible: (item: UserRoleModel): boolean => {
              return !this.authUser.hasRole(item.id) &&
                UserRoleModel.canModify(this.authUser);
            }
          },

          // Other actions
          {
            type: V2ActionType.MENU,
            icon: 'more_horiz',
            menuOptions: [
              // Delete Role
              {
                label: {
                  get: () => 'LNG_PAGE_LIST_USER_ROLES_ACTION_DELETE_ROLE'
                },
                cssClasses: () => 'gd-list-table-actions-action-menu-warning',
                action: {
                  click: (item: UserRoleModel): void => {
                    // determine what we need to delete
                    this.dialogV2Service.showConfirmDialog({
                      config: {
                        title: {
                          get: () => 'LNG_COMMON_LABEL_DELETE',
                          data: () => ({
                            name: item.name
                          })
                        },
                        message: {
                          get: () => 'LNG_DIALOG_CONFIRM_DELETE_USER_ROLE',
                          data: () => ({
                            name: item.name
                          })
                        }
                      }
                    }).subscribe((response) => {
                      // canceled ?
                      if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                        // finished
                        return;
                      }

                      // show loading
                      const loading = this.dialogV2Service.showLoadingDialog();

                      // delete the role
                      this.userRoleDataService
                        .deleteRole(item.id)
                        .pipe(
                          catchError((err) => {
                            // show error
                            this.toastV2Service.error(err);

                            // hide loading
                            loading.close();

                            // send error down the road
                            return throwError(err);
                          })
                        )
                        .subscribe(() => {
                          // success
                          this.toastV2Service.success('LNG_PAGE_LIST_USER_ROLES_ACTION_DELETE_USER_ROLE_SUCCESS_MESSAGE');

                          // hide loading
                          loading.close();

                          // reload data
                          this.needsRefreshList(true);
                        });
                    });
                  }
                },
                visible: (item: UserRoleModel): boolean => {
                  return !this.authUser.hasRole(item.id) &&
                    UserRoleModel.canDelete(this.authUser);
                }
              },

              // Divider
              {
                visible: (item: UserRoleModel): boolean => {
                  // visible only if at least one of the previous...
                  return !this.authUser.hasRole(item.id) &&
                    UserRoleModel.canDelete(this.authUser);
                }
              },

              // Clone Role
              {
                label: {
                  get: () => 'LNG_PAGE_LIST_USER_ROLES_ACTION_CLONE_ROLE'
                },
                action: {
                  link: (): string[] => {
                    return ['/user-roles/create'];
                  },
                  linkQueryParams: (item: UserRoleModel): Params => {
                    return {
                      cloneId: item.id
                    };
                  }
                },
                visible: (): boolean => {
                  return UserRoleModel.canClone(this.authUser);
                }
              }
            ]
          }
        ]
      }
    ];
  }

  /**
   * Initialize process data
   */
  protected initializeProcessSelectedData(): void {}

  /**
   * Initialize table infos
   */
  protected initializeTableInfos(): void {}

  /**
   * Initialize Table Advanced Filters
   */
  protected initializeTableAdvancedFilters(): void {
    this.advancedFilters = UserRoleModel.generateAdvancedFilters({
      options: {
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
        permission: this.activatedRoute.snapshot.data.permission
      }
    });
  }

  /**
   * Initialize table quick actions
   */
  protected initializeQuickActions(): void {}

  /**
   * Initialize table group actions
   */
  protected initializeGroupActions(): void {}

  /**
   * Initialize table add action
   */
  protected initializeAddAction(): void {
    this.addAction = {
      type: V2ActionType.ICON_LABEL,
      label: 'LNG_COMMON_BUTTON_ADD',
      icon: 'add_circle_outline',
      action: {
        link: (): string[] => ['/user-roles', 'create']
      },
      visible: (): boolean => {
        return UserRoleModel.canCreate(this.authUser);
      }
    };
  }

  /**
   * Initialize table grouped data
   */
  protected initializeGroupedData(): void {}

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs(): void {

    // set breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/account/my-profile']
        }
      }, {
        label: 'LNG_PAGE_LIST_USER_ROLES_TITLE',
        action: null
      }
    ];
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [
      'id',
      'name',
      'description',
      'users',
      'permissionIds'
    ];
  }

  /**
   * Re(load) the User Roles list
   */
  refreshList() {
    // make sure we include user information
    this.queryBuilder.filter.flag(
      'includeUsers',
      true
    );

    // get the list of existing roles
    this.rolesList$ = this.userRoleDataService
      .getRolesList(this.queryBuilder)
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(applyHasMoreLimit?: boolean) {
    // reset
    this.pageCount = undefined;

    // set apply value
    if (applyHasMoreLimit !== undefined) {
      this.applyHasMoreLimit = applyHasMoreLimit;
    }

    // remove paginator from query builder
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();

    // apply has more limit
    if (this.applyHasMoreLimit) {
      countQueryBuilder.flag(
        'applyHasMoreLimit',
        true
      );
    }

    // count
    this.userRoleDataService
      .getRolesCount(countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      ).subscribe((response) => {
        this.pageCount = response;
      });
  }
}
