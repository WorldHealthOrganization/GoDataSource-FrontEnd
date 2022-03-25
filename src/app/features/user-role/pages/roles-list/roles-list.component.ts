import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { UserModel, UserRoleModel, UserSettings } from '../../../../core/models/user.model';
import { PermissionModel } from '../../../../core/models/permission.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { catchError, share, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-roles-list',
  templateUrl: './roles-list.component.html'
})
export class RolesListComponent extends ListComponent implements OnInit, OnDestroy {
  // breadcrumbs: BreadcrumbItemModel[] = [
  //   new BreadcrumbItemModel('Roles', '.', true)
  // ];

  // constants
  PermissionModel = PermissionModel;
  UserSettings = UserSettings;
  UserRoleModel = UserRoleModel;

  // user list
  userList$: Observable<UserModel[]>;

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
      linkGenerator: (item: UserRoleModel): string[] => {
        return ['/user-roles', item.id, 'view'];
      },
      visible: (): boolean => {
        return UserRoleModel.canView(this.authUser);
      }
    }),

    // Modify Role
    new HoverRowAction({
      icon: 'settings',
      iconTooltip: 'LNG_PAGE_LIST_USER_ROLES_ACTION_MODIFY_ROLE',
      linkGenerator: (item: UserRoleModel): string[] => {
        return ['/user-roles', item.id, 'modify'];
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
        }),

        // Divider
        new HoverRowAction({
          type: HoverRowActionType.DIVIDER,
          visible: (item: UserRoleModel): boolean => {
            // visible only if at least one of the previous...
            return !this.authUser.hasRole(item.id) &&
                            UserRoleModel.canDelete(this.authUser);
          }
        }),

        // Clone Role
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_USER_ROLES_ACTION_CLONE_ROLE',
          click: (item: UserRoleModel) => {
            this.cloneRole(item);
          },
          visible: (): boolean => {
            return UserRoleModel.canClone(this.authUser);
          }
        }),
      ]
    })
  ];

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private router: Router,
    private userRoleDataService: UserRoleDataService,
    private toastV2Service: ToastV2Service,
    private dialogService: DialogService,
    private userDataService: UserDataService
  ) {
    super(listHelperService);
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
    this.initializeTableColumns();
  }

  /**
     * Release resources
     */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
  }

  /**
     * Initialize Side Table Columns
     */
  initializeTableColumns() {
    // default table columns
    // this.tableColumns = [
    //   new VisibleColumnModel({
    //     field: 'name',
    //     label: 'LNG_USER_ROLE_FIELD_LABEL_NAME'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'description',
    //     label: 'LNG_USER_ROLE_FIELD_LABEL_DESCRIPTION'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'users',
    //     label: 'LNG_USER_ROLE_FIELD_LABEL_USERS'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'permissions',
    //     label: 'LNG_USER_ROLE_FIELD_LABEL_PERMISSIONS'
    //   })
    // ];
  }

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs(): void {
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  refreshListFields(): string[] {
    return [];
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
          this.toastV2Service.error(err);
          finishCallback([]);
          return throwError(err);
        }),
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
          this.toastV2Service.error(err);
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
                this.toastV2Service.error(err, {userRoleName : userRole.name});
                return throwError(err);
              })
            )
            .subscribe(() => {
              this.toastV2Service.success('LNG_PAGE_LIST_USER_ROLES_ACTION_DELETE_USER_ROLE_SUCCESS_MESSAGE');

              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }

  /**
     * Create clone
     */
  private cloneRole(userRole: UserRoleModel) {
    this.router.navigate(
      ['/user-roles/create'], {
        queryParams: {
          cloneId: userRole.id
        }
      }
    );
  }
}
