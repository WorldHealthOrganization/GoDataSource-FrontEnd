import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserModel, UserRoleModel } from '../../../../core/models/user.model';
import { Observable, throwError } from 'rxjs';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { CreateViewModifyV2MenuType, CreateViewModifyV2TabInputType, ICreateViewModifyV2Buttons, ICreateViewModifyV2Tab } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { TranslateService } from '@ngx-translate/core';
import { catchError } from 'rxjs/operators';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { IV2SideDialogConfigButtonType, IV2SideDialogConfigInputSingleDropdown, V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { LanguageModel } from '../../../../core/models/language.model';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html'
})
export class MyProfileComponent extends CreateViewModifyComponent<UserModel> implements OnDestroy {
  /**
   * Constructor
   */
  constructor(
    protected router: Router,
    protected activatedRoute: ActivatedRoute,
    protected toastV2Service: ToastV2Service,
    protected userDataService: UserDataService,
    protected translateService: TranslateService,
    protected i18nService: I18nService,
    protected dialogV2Service: DialogV2Service,
    authDataService: AuthDataService,
    renderer2: Renderer2
  ) {
    super(
      activatedRoute,
      authDataService,
      toastV2Service,
      renderer2,
      router
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
   * Initialize tabs - Personal
   */
  private initializeTabsPersonal(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
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
                this.translateService.instant('LNG_USER_FIELD_LABEL_ALL_OUTBREAKS')
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
          },

          // Divider
          {
            type: CreateViewModifyV2MenuType.DIVIDER,
            visible: () => UserModel.canModifyOwnAccount(this.authUser)
          },

          // Change language
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_LAYOUT_LANGUAGE_LABEL',
            action: {
              click: () => {
                this.dialogV2Service.showSideDialog({
                  title: {
                    get: () => 'LNG_LAYOUT_LANGUAGE_LABEL'
                  },
                  hideInputFilter: true,
                  inputs: [{
                    type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
                    name: 'selectedLanguageId',
                    placeholder: 'LNG_LAYOUT_LANGUAGE_LABEL',
                    value: this.i18nService.getSelectedLanguageId(),
                    options: (this.activatedRoute.snapshot.data.languages as IResolverV2ResponseModel<LanguageModel>).options
                  }],
                  bottomButtons: [{
                    type: IV2SideDialogConfigButtonType.OTHER,
                    label: 'LNG_COMMON_BUTTON_CHANGE',
                    color: 'primary'
                  }, {
                    type: IV2SideDialogConfigButtonType.CANCEL,
                    label: 'LNG_COMMON_BUTTON_CANCEL',
                    color: 'text'
                  }]
                }).subscribe((response) => {
                  // cancelled ?
                  if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
                    // finished
                    return;
                  }

                  // change language
                  response.handler.loading.show();
                  this.i18nService
                    .changeLanguage((response.data.map.selectedLanguageId as IV2SideDialogConfigInputSingleDropdown).value)
                    .pipe(
                      catchError((err) => {
                        // show error
                        this.toastV2Service.error(err);

                        // hide
                        response.handler.hide();

                        // send error down the road
                        return throwError(err);
                      })
                    )
                    .subscribe(() => {
                      // hide
                      response.handler.hide();

                      // finished
                      this.toastV2Service.success('LNG_LAYOUT_ACTION_CHANGE_LANGUAGE_SUCCESS_MESSAGE');
                    });
                });
              }
            }
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
