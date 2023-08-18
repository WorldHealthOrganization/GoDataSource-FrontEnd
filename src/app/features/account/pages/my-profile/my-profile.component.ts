import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { UserModel, UserRoleModel } from '../../../../core/models/user.model';
import { Observable } from 'rxjs';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { CreateViewModifyV2MenuType, CreateViewModifyV2TabInputType, ICreateViewModifyV2Buttons, ICreateViewModifyV2Tab } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { CreateViewModifyHelperService } from '../../../../core/services/helper/create-view-modify-helper.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html'
})
export class MyProfileComponent extends CreateViewModifyComponent<UserModel> implements OnDestroy {
  /**
   * Constructor
   */
  constructor(
    protected authDataService: AuthDataService,
    protected activatedRoute: ActivatedRoute,
    protected renderer2: Renderer2,
    protected createViewModifyHelperService: CreateViewModifyHelperService,
    protected userDataService: UserDataService,
    protected dialogV2Service: DialogV2Service
  ) {
    super(
      authDataService,
      activatedRoute,
      renderer2,
      createViewModifyHelperService
    );
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
  protected createNewItem(): UserModel {
    return null;
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(): Observable<UserModel> {
    return this.userDataService
      .getUser(this.authUser.id);
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {}

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    this.pageTitle = 'LNG_PAGE_MY_PROFILE_TITLE';
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

    // view / edit profile
    this.breadcrumbs.push({
      label: 'LNG_PAGE_MY_PROFILE_TITLE',
      action: null
    });
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
        this.initializeTabsPersonal()
      ],

      // create details
      // - my profile doesn't require create
      create: undefined,

      // buttons
      buttons: this.initializeButtons(),

      // update
      createOrUpdate: undefined,
      redirectAfterCreateUpdate: undefined
    };
  }

  /**
   * Initialize tabs - My Profile
   */
  private initializeTabsPersonal(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'my_profile',
      label: 'LNG_PAGE_MY_PROFILE_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_PAGE_MODIFY_USER_TAB_DETAILS_TITLE',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'firstName',
              placeholder: () => 'LNG_USER_FIELD_LABEL_FIRST_NAME',
              description: () => 'LNG_USER_FIELD_LABEL_FIRST_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.firstName,
                set: undefined
              },
              validators: {
                required: () => true
              }
            },
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'lastName',
              placeholder: () => 'LNG_USER_FIELD_LABEL_LAST_NAME',
              description: () => 'LNG_USER_FIELD_LABEL_LAST_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.lastName,
                set: undefined
              },
              validators: {
                required: () => true
              }
            },
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'email',
              placeholder: () => 'LNG_USER_FIELD_LABEL_EMAIL',
              description: () => 'LNG_USER_FIELD_LABEL_EMAIL_DESCRIPTION',
              value: {
                get: () => this.itemData.email,
                set: undefined
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_MULTIPLE,
              name: 'roleIds',
              placeholder: () => 'LNG_USER_FIELD_LABEL_ROLES',
              description: () => 'LNG_USER_FIELD_LABEL_ROLES_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.userRole as IResolverV2ResponseModel<UserRoleModel>).options,
              value: {
                get: () => this.itemData.roleIds,
                set: undefined
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_MULTIPLE,
              name: 'outbreakIds',
              placeholder: () => 'LNG_USER_FIELD_LABEL_AVAILABLE_OUTBREAKS',
              description: () => 'LNG_USER_FIELD_LABEL_AVAILABLE_OUTBREAKS_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).options,
              value: {
                get: () => this.itemData.outbreakIds,
                set: undefined
              },
              noValueLabel: () => this.itemData.outbreakIds?.length > 0 ?
                undefined :
                this.createViewModifyHelperService.i18nService.instant('LNG_USER_FIELD_LABEL_ALL_OUTBREAKS')
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'activeOutbreakId',
              placeholder: () => 'LNG_USER_FIELD_LABEL_ACTIVE_OUTBREAK',
              description: () => 'LNG_USER_FIELD_LABEL_ACTIVE_OUTBREAK_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).options,
              value: {
                get: () => this.itemData.activeOutbreakId,
                set: undefined
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'dontCacheFilters',
              placeholder: () => 'LNG_USER_FIELD_LABEL_DONT_CACHE_FILTERS',
              description: () => 'LNG_USER_FIELD_LABEL_DONT_CACHE_FILTERS_DESCRIPTION',
              value: {
                get: () => this.itemData.dontCacheFilters,
                set: undefined
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
          link: () => ['/account', 'my-profile']
        }
      },
      modify: undefined,
      createCancel: undefined,
      viewCancel: undefined,
      modifyCancel: {
        link: {
          link: () => ['/account', 'my-profile']
        }
      },
      quickActions: {
        options: [
          // Change password
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_LAYOUT_MENU_ITEM_CHANGE_PASSWORD_LABEL',
            action: {
              link: () => ['/account/change-password']
            },
            visible: () => UserModel.canModifyOwnAccount(this.authUser)
          },

          // Set security questions
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_LAYOUT_MENU_ITEM_SET_SECURITY_QUESTION_LABEL',
            action: {
              link: () => ['/account/set-security-questions']
            },
            visible: () => UserModel.canModifyOwnAccount(this.authUser)
          }
        ]
      }
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {}

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void {}

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {}

  /**
   * Refresh expand list
   */
  refreshExpandList(): void {}
}
