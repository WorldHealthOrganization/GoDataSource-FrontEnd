import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import * as _ from 'lodash';
import { throwError } from 'rxjs';
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
import { IV2Column, IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { PermissionModel } from '../../../../core/models/permission.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import {
  ExportDataExtension,
  ExportDataMethod
} from '../../../../core/services/helper/models/dialog-v2.model';
import * as momentOriginal from 'moment/moment';

@Component({
  selector: 'app-roles-list',
  templateUrl: './roles-list.component.html'
})
export class RolesListComponent extends ListComponent<UserRoleModel, IV2Column> implements OnDestroy {
  // role fields
  roleFields: ILabelValuePairModel[] = [
    { label: 'LNG_USER_ROLE_FIELD_LABEL_NAME', value: 'name' },
    { label: 'LNG_USER_ROLE_FIELD_LABEL_PERMISSIONS', value: 'permissionIds' },
    { label: 'LNG_USER_ROLE_FIELD_LABEL_DESCRIPTION', value: 'description' },
    { label: 'LNG_USER_ROLE_FIELD_LABEL_CREATED_AT', value: 'createdAt' },
    { label: 'LNG_USER_ROLE_FIELD_LABEL_CREATED_BY', value: 'createdBy' },
    { label: 'LNG_USER_ROLE_FIELD_LABEL_UPDATED_AT', value: 'updatedAt' },
    { label: 'LNG_USER_ROLE_FIELD_LABEL_UPDATED_BY', value: 'updatedBy' },
    { label: 'LNG_USER_ROLE_FIELD_LABEL_DELETED', value: 'deleted' },
    { label: 'LNG_USER_ROLE_FIELD_LABEL_DELETED_AT', value: 'deletedAt' },
    { label: 'LNG_USER_ROLE_FIELD_LABEL_CREATED_ON', value: 'createdOn' }
  ];

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
    super(
      listHelperService, {
        disableFilterCaching: true,
        disableWaitForSelectedOutbreakToRefreshList: true
      }
    );
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
   * Table column - actions
   */
  protected initializeTableColumnActions(): void {
    this.tableColumnActions = {
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
    };
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
      {
        field: 'createdBy',
        label: 'LNG_USER_ROLE_FIELD_LABEL_CREATED_BY',
        notVisible: true,
        format: {
          type: 'createdByUser.nameAndEmail'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        link: (data) => {
          return data.createdBy && UserModel.canView(this.authUser) && !data.createdByUser?.deleted ?
            `/users/${data.createdBy}/view` :
            undefined;
        }
      },
      {
        field: 'createdOn',
        label: 'LNG_USER_ROLE_FIELD_LABEL_CREATED_ON',
        notVisible: true,
        format: {
          type: (item) => item.createdOn ?
            this.i18nService.instant(`LNG_PLATFORM_LABEL_${item.createdOn}`) :
            item.createdOn
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.createdOn as IResolverV2ResponseModel<ILabelValuePairModel>).options,
          includeNoValue: true
        },
        sortable: true
      },
      {
        field: 'createdAt',
        label: 'LNG_USER_ROLE_FIELD_LABEL_CREATED_AT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true
      },
      {
        field: 'updatedBy',
        label: 'LNG_USER_ROLE_FIELD_LABEL_UPDATED_BY',
        notVisible: true,
        format: {
          type: 'updatedByUser.nameAndEmail'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        link: (data) => {
          return data.updatedBy && UserModel.canView(this.authUser) && !data.updatedByUser?.deleted ?
            `/users/${data.updatedBy}/view` :
            undefined;
        }
      },
      {
        field: 'updatedAt',
        label: 'LNG_USER_ROLE_FIELD_LABEL_UPDATED_AT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true
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
        createdOn: (this.activatedRoute.snapshot.data.createdOn as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
        permission: this.activatedRoute.snapshot.data.permission
      }
    });
  }

  /**
   * Initialize table quick actions
   */
  protected initializeQuickActions(): void {
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_COMMON_BUTTON_QUICK_ACTIONS',
      visible: (): boolean => {
        return UserRoleModel.canExport(this.authUser) ||
          UserRoleModel.canImport(this.authUser);
      },
      menuOptions: [
        // Export roles
        {
          label: {
            get: () => 'LNG_PAGE_LIST_USER_ROLES_EXPORT_BUTTON'
          },
          action: {
            click: () => {
              // remove the includeUsers flag because users are exported separately
              const qb: RequestQueryBuilder = new RequestQueryBuilder();
              qb.merge(this.queryBuilder);
              qb.filter.removeFlag('includeUsers');

              // export
              this.exportRoles(qb);
            }
          },
          visible: (): boolean => {
            return UserRoleModel.canExport(this.authUser);
          }
        },

        // Import roles
        {
          label: {
            get: () => 'LNG_PAGE_LIST_USER_ROLES_IMPORT_BUTTON'
          },
          action: {
            link: () => ['/import-export-data', 'user-role-data', 'import']
          },
          visible: (): boolean => {
            return UserRoleModel.canImport(this.authUser);
          }
        }
      ]
    };
  }

  /**
   * Initialize table group actions
   */
  protected initializeGroupActions(): void {
    this.groupActions = {
      type: V2ActionType.GROUP_ACTIONS,
      visible: () => UserRoleModel.canExport(this.authUser),
      actions: [
        {
          label: {
            get: () => 'LNG_PAGE_LIST_USER_ROLES_GROUP_ACTION_EXPORT_SELECTED_USER_ROLES'
          },
          action: {
            click: (selected: string[]) => {
              // construct query builder
              const qb = new RequestQueryBuilder();
              qb.filter.bySelect('id', selected, true, null);

              // allow deleted records
              qb.includeDeleted();

              // keep sort order
              if (!this.queryBuilder.sort.isEmpty()) {
                qb.sort.criterias = {
                  ...this.queryBuilder.sort.criterias
                };
              }

              // export
              this.exportRoles(qb);
            }
          },
          visible: (): boolean => {
            return UserRoleModel.canExport(this.authUser);
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1;
          }
        }
      ]
    };
  }

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
      'permissionIds',
      'createdBy',
      'createdOn',
      'createdAt',
      'updatedBy',
      'updatedAt'
    ];
  }

  /**
   * Re(load) the User Roles list
   */
  refreshList() {
    // retrieve created user & modified user information
    this.queryBuilder.include('createdByUser', true);
    this.queryBuilder.include('updatedByUser', true);

    // make sure we include user information
    this.queryBuilder.filter.flag(
      'includeUsers',
      true
    );

    // get the list of existing roles
    this.records$ = this.userRoleDataService
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
    countQueryBuilder.clearFields();

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

  /**
   * Export selected records
   */
  private exportRoles(qb: RequestQueryBuilder): void {
    this.dialogV2Service
      .showExportData({
        title: {
          get: () => 'LNG_PAGE_LIST_USER_ROLES_EXPORT_TITLE'
        },
        export: {
          url: 'roles/export',
          async: true,
          method: ExportDataMethod.POST,
          fileName: `${ this.i18nService.instant('LNG_PAGE_LIST_USER_ROLES_TITLE') } - ${ momentOriginal().format('YYYY-MM-DD HH:mm') }`,
          queryBuilder: qb,
          allow: {
            types: [
              ExportDataExtension.CSV,
              ExportDataExtension.XLS,
              ExportDataExtension.XLSX,
              ExportDataExtension.JSON,
              ExportDataExtension.ODS,
              ExportDataExtension.PDF
            ],
            anonymize: {
              fields: this.roleFields
            },
            fields: {
              options: this.roleFields
            },
            dbColumns: true,
            dbValues: true,
            jsonReplaceUndefinedWithNull: true
          }
        }
      });
  }
}
