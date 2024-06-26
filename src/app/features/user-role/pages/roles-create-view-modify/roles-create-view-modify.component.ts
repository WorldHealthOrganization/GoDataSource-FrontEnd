import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable, throwError } from 'rxjs';
import {
  CreateViewModifyV2ActionType,
  CreateViewModifyV2MenuType,
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { CreateViewModifyV2ExpandColumnType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { RequestFilterGenerator } from '../../../../core/helperClasses/request-query-builder';
import { catchError, takeUntil } from 'rxjs/operators';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { UserModel, UserRoleModel } from '../../../../core/models/user.model';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { PERMISSION, PermissionModel } from '../../../../core/models/permission.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { UserRoleHelper } from '../../../../core/helperClasses/user-role.helper';
import { OutbreakAndOutbreakTemplateHelperService } from '../../../../core/services/helper/outbreak-and-outbreak-template-helper.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';

/**
 * Component
 */
@Component({
  selector: 'app-roles-create-view-modify',
  templateUrl: './roles-create-view-modify.component.html'
})
export class RolesCreateViewModifyComponent extends CreateViewModifyComponent<UserRoleModel> implements OnDestroy {
  // clone role
  private _cloneRole: UserRoleModel;

  /**
   * Constructor
   */
  constructor(
    protected authDataService: AuthDataService,
    protected activatedRoute: ActivatedRoute,
    protected renderer2: Renderer2,
    protected redirectService: RedirectService,
    protected toastV2Service: ToastV2Service,
    protected outbreakAndOutbreakTemplateHelperService: OutbreakAndOutbreakTemplateHelperService,
    protected i18nService: I18nService,
    protected router: Router,
    protected dialogV2Service: DialogV2Service,
    protected userRoleDataService: UserRoleDataService
  ) {
    // parent
    super(
      authDataService,
      activatedRoute,
      renderer2,
      redirectService,
      toastV2Service,
      outbreakAndOutbreakTemplateHelperService
    );

    // clone role ?
    if (this.isCreate) {
      // get data
      this._cloneRole = activatedRoute.snapshot.data.userRole;

      // cleanup
      if (this._cloneRole) {
        delete this._cloneRole.id;
        delete this._cloneRole.name;
        delete this._cloneRole.createdBy;
        delete this._cloneRole.createdAt;
        delete this._cloneRole.updatedBy;
        delete this._cloneRole.updatedAt;
        delete this._cloneRole.deleted;
        delete this._cloneRole.deletedAt;
        delete this._cloneRole.users;
      }
    }
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();
  }

  /**
   * Create new item model if needed
   */
  protected createNewItem(): UserRoleModel {
    return new UserRoleModel(this._cloneRole);
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: UserRoleModel): Observable<UserRoleModel> {
    return this.userRoleDataService
      .getRole(
        record ?
          record.id :
          this.activatedRoute.snapshot.params.roleId
      );
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {}

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // add info accordingly to page type
    if (this.isCreate) {
      this.pageTitle = 'LNG_PAGE_CREATE_USER_ROLE_TITLE';
      this.pageTitleData = undefined;
    } else if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_USER_ROLES_TITLE';
      this.pageTitleData = {
        name: this.itemData.name
      };
    } else {
      // view
      this.pageTitle = 'LNG_PAGE_VIEW_USER_ROLES_TITLE';
      this.pageTitleData = {
        name: this.itemData.name
      };
    }
  }

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs() {
    // reset breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/account/my-profile']
        }
      }
    ];

    // list page
    if (UserRoleModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_USER_ROLES_TITLE',
        action: {
          link: ['/user-roles']
        }
      });
    }

    // add info accordingly to page type
    if (this.isCreate) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_CREATE_USER_ROLE_TITLE',
        action: null
      });
    } else if (this.isModify) {
      this.breadcrumbs.push({
        label: this.i18nService.instant(
          'LNG_PAGE_MODIFY_USER_ROLES_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.i18nService.instant(
          'LNG_PAGE_VIEW_USER_ROLES_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    }
  }

  /**
   * Initialize breadcrumb infos
   */
  protected initializeBreadcrumbInfos(): void {}

  /**
   * Initialize tabs
   */
  protected initializeTabs(): void {
    this.tabData = {
      // tabs
      tabs: [
        // Personal
        this.initializeTabsPersonal()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.i18nService.instant('LNG_PAGE_CREATE_USER_ROLE_CREATE_USER_ROLE_BUTTON'),
          message: () => this.i18nService.instant(
            'LNG_STEPPER_FINAL_STEP_TEXT_GENERAL',
            this.itemData
          )
        }
      },

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: (
        data: UserRoleModel,
        extraQueryParams: Params
      ) => {
        // redirect to view
        this.router.navigate(
          [
            '/user-roles',
            data.id,
            'view'
          ], {
            queryParams: extraQueryParams
          }
        );
      }
    };
  }

  /**
   * Initialize tabs - Details
   */
  private initializeTabsPersonal(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'details',
      label: this.isCreate ?
        'LNG_PAGE_CREATE_USER_ROLE_TAB_DETAILS_TITLE' :
        'LNG_PAGE_MODIFY_USER_ROLES_DETAILS_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: this.isCreate ?
            'LNG_PAGE_CREATE_USER_ROLE_TAB_DETAILS_TITLE' :
            'LNG_PAGE_MODIFY_USER_ROLES_DETAILS_TITLE',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'name',
              placeholder: () => 'LNG_USER_ROLE_FIELD_LABEL_NAME',
              description: () => 'LNG_USER_ROLE_FIELD_LABEL_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.name,
                set: (value) => {
                  // set data
                  this.itemData.name = value;
                }
              },
              validators: {
                required: () => true
              }
            },
            {
              type: CreateViewModifyV2TabInputType.TEXTAREA,
              name: 'description',
              placeholder: () => 'LNG_USER_ROLE_FIELD_LABEL_DESCRIPTION',
              description: () => 'LNG_USER_ROLE_FIELD_LABEL_DESCRIPTION_DESCRIPTION',
              value: {
                get: () => this.itemData.description,
                set: (value) => {
                  // set data
                  this.itemData.description = value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_GROUPS,
              name: 'permissionIds',
              placeholder: () => 'LNG_USER_ROLE_FIELD_LABEL_PERMISSIONS',
              description: () => 'LNG_USER_ROLE_FIELD_LABEL_PERMISSIONS_DESCRIPTION',
              value: {
                get: () => this.itemData.permissionIds,
                set: (value) => {
                  // set data
                  this.itemData.permissionIds = value as PERMISSION[];
                }
              },
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
              defaultValues: PermissionModel.HIDDEN_PERMISSIONS,
              appGroupOptionsRequirementsKey: 'requires',
              requiredWithoutDefaultValues: true,
              groupOptionFormatMethod: this.isView ? undefined : (
                sanitized,
                i18nService,
                optionsMap,
                option
              ) => {
                return UserRoleHelper.groupOptionFormatMethod(
                  sanitized,
                  i18nService,
                  optionsMap,
                  option
                );
              },
              groupSelectionChanged: (data) => {
                UserRoleHelper.groupSelectionChanged(
                  data,
                  this.i18nService,
                  this.dialogV2Service
                );
              },
              groupOptionCheckStateChanged: (data) => {
                UserRoleHelper.groupOptionCheckStateChanged(
                  data,
                  this.i18nService,
                  this.dialogV2Service
                );
              },
              validators: {
                required: () => true
              }
            }
          ]
        }
      ]
    };
  }

  /**
   * Initialize buttons
   */
  private initializeButtons(): ICreateViewModifyV2Buttons {
    return {
      view: {
        link: {
          link: () => ['/user-roles', this.itemData?.id, 'view']
        }
      },
      modify: {
        link: {
          link: () => ['/user-roles', this.itemData?.id, 'modify']
        },
        visible: () => UserRoleModel.canModify(this.authUser)
      },
      createCancel: {
        link: {
          link: () => ['/user-roles']
        }
      },
      viewCancel: {
        link: {
          link: () => ['/user-roles']
        }
      },
      modifyCancel: {
        link: {
          link: () => ['/user-roles']
        }
      },
      quickActions: {
        options: [
          // Record details
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_COMMON_LABEL_DETAILS',
            action: {
              click: () => {
                // show record details dialog
                this.dialogV2Service.showRecordDetailsDialog(
                  this.authUser,
                  'LNG_COMMON_LABEL_DETAILS',
                  this.itemData,
                  this.activatedRoute.snapshot.data.user,
                  this.activatedRoute.snapshot.data.deletedUser
                );
              }
            }
          }
        ]
      }
    };
  }

  /**
   * Initialize process data
   */
  private initializeProcessData(): ICreateViewModifyV2CreateOrUpdate {
    return (
      type,
      data,
      finished,
      _loading,
      _forms
    ) => {
      // create / modify
      (
        type === CreateViewModifyV2ActionType.CREATE ?
          this.userRoleDataService.createRole(
            data
          ) :
          this.userRoleDataService.modifyRole(
            this.itemData.id,
            data
          )
      ).pipe(
        catchError((err) => {
          // show error
          finished(err, undefined);

          // finished
          return throwError(err);
        })
      ).subscribe((outbreak) => {
        // display message
        this.toastV2Service.success(
          type === CreateViewModifyV2ActionType.CREATE ?
            'LNG_PAGE_CREATE_USER_ROLE_ACTION_CREATE_USER_ROLE_SUCCESS_MESSAGE' :
            'LNG_PAGE_MODIFY_USER_ROLES_ACTION_MODIFY_USER_ROLES_SUCCESS_MESSAGE'
        );

        // hide loading & redirect
        finished(undefined, outbreak);
      });
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {
    this.expandListColumnRenderer = {
      type: CreateViewModifyV2ExpandColumnType.TEXT,
      link: (item: UserRoleModel) => ['/user-roles', item.id, 'view'],
      get: {
        text: (item: UserRoleModel) => item.name
      }
    };
  }

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void {
    this.expandListQueryFields = [
      'id',
      'name'
    ];
  }

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {
    this.expandListAdvancedFilters = UserRoleModel.generateAdvancedFilters({
      options: {
        createdOn: (this.activatedRoute.snapshot.data.createdOn as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
        permission: this.activatedRoute.snapshot.data.permission as PermissionModel[]
      }
    });
  }

  /**
   * Refresh expand list
   */
  refreshExpandList(data): void {
    // append / remove search
    if (data.searchBy) {
      data.queryBuilder.filter.where({
        name: RequestFilterGenerator.textContains(
          data.searchBy
        )
      });
    }

    // retrieve data
    this.expandListRecords$ = this.userRoleDataService
      .getRolesList(data.queryBuilder)
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }
}
