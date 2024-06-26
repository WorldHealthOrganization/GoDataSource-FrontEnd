import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { Observable, throwError } from 'rxjs';
import {
  CreateViewModifyV2ActionType, CreateViewModifyV2MenuType,
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab, ICreateViewModifyV2TabInputSingleSelect
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { PhoneNumberType, UserModel } from '../../../../core/models/user.model';
import { CreateViewModifyV2ExpandColumnType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { RequestFilterGenerator } from '../../../../core/helperClasses/request-query-builder';
import { catchError, takeUntil } from 'rxjs/operators';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { LanguageModel } from '../../../../core/models/language.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import * as _ from 'lodash';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { OutbreakAndOutbreakTemplateHelperService } from '../../../../core/services/helper/outbreak-and-outbreak-template-helper.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { LocalizationHelper } from '../../../../core/helperClasses/localization-helper';

/**
 * Component
 */
@Component({
  selector: 'app-user-create-view-modify',
  templateUrl: './user-create-view-modify.component.html'
})
export class UserCreateViewModifyComponent extends CreateViewModifyComponent<UserModel> implements OnDestroy {
  // data
  private _passwordConfirm: string;

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
    protected userDataService: UserDataService,
    protected router: Router,
    protected dialogV2Service: DialogV2Service
  ) {
    super(
      authDataService,
      activatedRoute,
      renderer2,
      redirectService,
      toastV2Service,
      outbreakAndOutbreakTemplateHelperService
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
    return new UserModel();
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: UserModel): Observable<UserModel> {
    return this.userDataService
      .getUser(
        record ?
          record.id :
          this.activatedRoute.snapshot.params.userId
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
      this.pageTitle = 'LNG_PAGE_CREATE_USER_TITLE';
      this.pageTitleData = undefined;
    } else if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_USER_TITLE';
      this.pageTitleData = {
        name: this.itemData.name
      };
    } else {
      // view
      this.pageTitle = 'LNG_PAGE_VIEW_USER_TITLE';
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
    if (UserModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_USERS_TITLE',
        action: {
          link: ['/users']
        }
      });
    }

    // add info accordingly to page type
    if (this.isCreate) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_CREATE_USER_TITLE',
        action: null
      });
    } else if (this.isModify) {
      this.breadcrumbs.push({
        label: this.i18nService.instant(
          'LNG_PAGE_MODIFY_USER_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.i18nService.instant(
          'LNG_PAGE_VIEW_USER_TITLE', {
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
          buttonLabel: this.i18nService.instant('LNG_PAGE_CREATE_USER_ACTION_CREATE_USER_BUTTON'),
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
        data: UserModel,
        extraQueryParams: Params
      ) => {
        // redirect to view
        this.router.navigate(
          [
            '/users',
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
    const tab: ICreateViewModifyV2Tab = {
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'details',
      label: this.isCreate ?
        'LNG_PAGE_CREATE_USER_TAB_DETAILS_TITLE' :
        'LNG_PAGE_MODIFY_USER_TAB_DETAILS_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: this.isCreate ?
            'LNG_PAGE_CREATE_USER_TAB_DETAILS_TITLE' :
            'LNG_PAGE_MODIFY_USER_TAB_DETAILS_TITLE',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'firstName',
              placeholder: () => 'LNG_USER_FIELD_LABEL_FIRST_NAME',
              description: () => 'LNG_USER_FIELD_LABEL_FIRST_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.firstName,
                set: (value) => {
                  // set data
                  this.itemData.firstName = value;
                }
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
                set: (value) => {
                  // set data
                  this.itemData.lastName = value;
                }
              },
              validators: {
                required: () => true
              }
            },
            {
              type: CreateViewModifyV2TabInputType.EMAIL,
              name: 'email',
              placeholder: () => 'LNG_USER_FIELD_LABEL_EMAIL',
              description: () => 'LNG_USER_FIELD_LABEL_EMAIL_DESCRIPTION',
              value: {
                get: () => this.itemData.email,
                set: (value) => {
                  // set data
                  this.itemData.email = value;
                }
              },
              validators: {
                required: () => true
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_MULTIPLE,
              name: 'roleIds',
              placeholder: () => 'LNG_USER_FIELD_LABEL_ROLES',
              description: () => 'LNG_USER_FIELD_LABEL_ROLES_DESCRIPTION',
              value: {
                get: () => this.itemData.roleIds,
                set: (value) => {
                  // set data
                  this.itemData.roleIds = value;
                }
              },
              options: (this.activatedRoute.snapshot.data.userRole as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              validators: {
                required: () => true
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'institutionName',
              placeholder: () => 'LNG_USER_FIELD_LABEL_INSTITUTION_NAME',
              description: () => 'LNG_USER_FIELD_LABEL_INSTITUTION_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.institutionName,
                set: (value) => {
                  // set data
                  this.itemData.institutionName = value;
                }
              },
              options: (this.activatedRoute.snapshot.data.institution as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
            },
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'telephoneNumbers[' + PhoneNumberType.PRIMARY_PHONE_NUMBER + ']',
              placeholder: () => 'LNG_USER_FIELD_LABEL_TELEPHONE_NUMBERS',
              description: () => 'LNG_USER_FIELD_LABEL_TELEPHONE_NUMBERS_DESCRIPTION',
              value: {
                get: () => this.itemData.telephoneNumbers ?
                  this.itemData.telephoneNumbers[PhoneNumberType.PRIMARY_PHONE_NUMBER] :
                  '',
                set: (value) => {
                  // initialize
                  if (!this.itemData.telephoneNumbers) {
                    this.itemData.telephoneNumbers = {};
                  }

                  // set data
                  this.itemData.telephoneNumbers[PhoneNumberType.PRIMARY_PHONE_NUMBER] = value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'disregardGeographicRestrictions',
              placeholder: () => 'LNG_USER_FIELD_LABEL_DISREGARD_GEOGRAPHIC_RESTRICTIONS',
              description: () => 'LNG_USER_FIELD_LABEL_DISREGARD_GEOGRAPHIC_RESTRICTIONS_DESCRIPTION',
              value: {
                get: () => this.itemData.disregardGeographicRestrictions,
                set: (value) => {
                  // set data
                  this.itemData.disregardGeographicRestrictions = value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'dontCacheFilters',
              placeholder: () => 'LNG_USER_FIELD_LABEL_DONT_CACHE_FILTERS',
              description: () => 'LNG_USER_FIELD_LABEL_DONT_CACHE_FILTERS_DESCRIPTION',
              value: {
                get: () => this.itemData.dontCacheFilters,
                set: (value) => {
                  // set data
                  this.itemData.dontCacheFilters = value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_MULTIPLE,
              name: 'outbreakIds',
              placeholder: () => this.itemData.outbreakIds?.length > 0 ? 'LNG_USER_FIELD_LABEL_AVAILABLE_OUTBREAKS' : 'LNG_USER_FIELD_LABEL_ALL_OUTBREAKS',
              description: () => 'LNG_USER_FIELD_LABEL_AVAILABLE_OUTBREAKS_DESCRIPTION',
              value: {
                get: () => this.itemData.outbreakIds,
                set: (value) => {
                  // set data
                  this.itemData.outbreakIds = value;

                  // update visible active outbreaks
                  (tab.nameToInput.activeOutbreakId as ICreateViewModifyV2TabInputSingleSelect).options = this.getAllowedActiveOutbreaks();
                }
              },
              options: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              disabled: (): boolean => {
                return !OutbreakModel.canList(this.authUser);
              },
              replace: {
                condition: () => !OutbreakModel.canList(this.authUser),
                html: this.i18nService.instant('LNG_USER_FIELD_LABEL_CANT_SET_ALL_OUTBREAKS')
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'activeOutbreakId',
              placeholder: () => 'LNG_USER_FIELD_LABEL_ACTIVE_OUTBREAK',
              description: () => 'LNG_USER_FIELD_LABEL_ACTIVE_OUTBREAK_DESCRIPTION',
              value: {
                get: () => this.itemData.activeOutbreakId,
                set: (value) => {
                  // set data
                  this.itemData.activeOutbreakId = value;
                }
              },
              options: this.getAllowedActiveOutbreaks(),
              disabled: (): boolean => {
                return !OutbreakModel.canList(this.authUser);
              },
              replace: {
                condition: () => !OutbreakModel.canList(this.authUser),
                html: this.i18nService.instant('LNG_USER_FIELD_LABEL_CANT_SET_ACTIVE_OUTBREAK')
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'languageId',
              placeholder: () => 'LNG_USER_FIELD_LABEL_LANGUAGE',
              description: () => 'LNG_USER_FIELD_LABEL_LANGUAGE_DESCRIPTION',
              value: {
                get: () => this.itemData.languageId,
                set: (value) => {
                  // set data
                  this.itemData.languageId = value;
                }
              },
              options: (this.activatedRoute.snapshot.data.language as IResolverV2ResponseModel<LanguageModel>).options
            }
          ]
        },

        // Password
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_PAGE_MODIFY_USER_TAB_DETAILS_SECTION_PASSWORD_TITLE',
          visible: () => !this.isView,
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.PASSWORD,
              name: 'password',
              placeholder: () => 'LNG_PAGE_RESET_PASSWORD_FIELD_LABEL_NEW_PASSWORD',
              description: () => 'LNG_PAGE_RESET_PASSWORD_FIELD_LABEL_NEW_PASSWORD_DESCRIPTION',
              value: {
                get: () => this.itemData.password,
                set: (value) => {
                  // set data
                  this.itemData.password = value;
                }
              },
              validators: {
                required: () => this.isCreate || !!this._passwordConfirm,
                minlength: () => 12,
                validateOther: () => 'passwordConfirm'
              }
            },
            {
              type: CreateViewModifyV2TabInputType.PASSWORD,
              name: 'passwordConfirm',
              placeholder: () => 'LNG_PAGE_RESET_PASSWORD_FIELD_LABEL_CONFIRM_NEW_PASSWORD',
              description: () => 'LNG_PAGE_RESET_PASSWORD_FIELD_LABEL_CONFIRM_NEW_PASSWORD_DESCRIPTION',
              value: {
                get: () => this._passwordConfirm,
                set: (value) => {
                  // set data
                  this._passwordConfirm = value;
                }
              },
              validators: {
                required: () => this.isCreate || !!this.itemData.password,
                equalValidator: () => ({
                  input: 'password',
                  err: 'LNG_FORM_VALIDATION_ERROR_EQUAL_PASSWORD_VALUE'
                })
              }
            }
          ]
        }
      ]
    };

    // finished
    return tab;
  }

  /**
   * Initialize buttons
   */
  private initializeButtons(): ICreateViewModifyV2Buttons {
    return {
      view: {
        link: {
          link: () => ['/users', this.itemData?.id, 'view']
        }
      },
      modify: {
        link: {
          link: () => ['/users', this.itemData?.id, 'modify']
        },
        visible: () => UserModel.canModify(this.authUser)
      },
      createCancel: {
        link: {
          link: () => ['/users']
        }
      },
      viewCancel: {
        link: {
          link: () => ['/users']
        }
      },
      modifyCancel: {
        link: {
          link: () => ['/users']
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
                  this.activatedRoute.snapshot.data.deletedUser, [{
                    type: V2SideDialogConfigInputType.KEY_VALUE,
                    name: 'lastLogin',
                    placeholder: 'LNG_USER_FIELD_LABEL_LAST_LOGIN',
                    value: this.itemData.lastLogin ?
                      LocalizationHelper.displayDateTime(this.itemData.lastLogin) :
                      '—'
                  }]
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
      // cleanup
      delete data.passwordConfirm;

      // create / modify
      (
        type === CreateViewModifyV2ActionType.CREATE ?
          this.userDataService.createUser(
            data
          ) :
          this.userDataService.modifyUser(
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
            'LNG_PAGE_CREATE_USER_ACTION_CREATE_USER_SUCCESS_MESSAGE' :
            'LNG_PAGE_MODIFY_USER_ACTION_MODIFY_USER_SUCCESS_MESSAGE'
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
      link: (item: UserModel) => ['/users', item.id, 'view'],
      get: {
        text: (item: UserModel) => item.name
      }
    };
  }

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void {
    this.expandListQueryFields = [
      'id',
      'firstName',
      'lastName'
    ];
  }

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {
    this.expandListAdvancedFilters = UserModel.generateAdvancedFilters({
      authUser: this.authUser,
      options: {
        createdOn: (this.activatedRoute.snapshot.data.createdOn as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        institution: (this.activatedRoute.snapshot.data.institution as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        userRole: (this.activatedRoute.snapshot.data.userRole as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        outbreak: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        team: (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        language: (this.activatedRoute.snapshot.data.language as IResolverV2ResponseModel<LanguageModel>).options,
        yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
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
        or: [
          {
            firstName: RequestFilterGenerator.textContains(
              data.searchBy
            )
          }, {
            lastName: RequestFilterGenerator.textContains(
              data.searchBy
            )
          }
        ]
      });
    }

    // retrieve data
    this.expandListRecords$ = this.userDataService
      .getUsersList(data.queryBuilder)
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Determine allowed active outbreaks
   */
  private getAllowedActiveOutbreaks(): ILabelValuePairModel[] {
    // map allowed outbreaks
    const allowed: {
      [outbreakId: string]: true
    } = {};
    this.itemData.outbreakIds?.forEach((outbreakId) => {
      allowed[outbreakId] = true;
    });

    // all allowed ?
    const allAllowed: boolean = Object.keys(allowed).length < 1;

    // create list of options
    const optionsClone: ILabelValuePairModel[] = _.cloneDeep((this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<ReferenceDataEntryModel>).options);

    // disable those to which we shouldn't have access
    optionsClone.forEach((item) => {
      item.disabled = !allAllowed && !allowed[item.value];
    });

    // finished
    return optionsClone;
  }
}
