import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable, throwError } from 'rxjs';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { TranslateService } from '@ngx-translate/core';
import {
  CreateViewModifyV2ActionType, CreateViewModifyV2MenuType,
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { PhoneNumberType, UserModel } from '../../../../core/models/user.model';
import { CreateViewModifyV2ExpandColumnType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { RequestFilterGenerator } from '../../../../core/helperClasses/request-query-builder';
import { catchError, takeUntil } from 'rxjs/operators';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';

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
    protected activatedRoute: ActivatedRoute,
    protected toastV2Service: ToastV2Service,
    protected userDataService: UserDataService,
    protected translateService: TranslateService,
    protected router: Router,
    protected dialogV2Service: DialogV2Service,
    authDataService: AuthDataService,
    renderer2: Renderer2,
    redirectService: RedirectService
  ) {
    super(
      toastV2Service,
      renderer2,
      redirectService,
      activatedRoute,
      authDataService
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
        label: this.translateService.instant(
          'LNG_PAGE_MODIFY_USER_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_VIEW_USER_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    }
  }

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
          buttonLabel: this.translateService.instant('LNG_PAGE_CREATE_USER_ACTION_CREATE_USER_BUTTON'),
          message: () => this.translateService.instant(
            'LNG_STEPPER_FINAL_STEP_TEXT_GENERAL',
            this.itemData
          )
        }
      },

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: (data: UserModel) => {
        // redirect to view
        this.router.navigate([
          '/users',
          data.id,
          'view'
        ]);
      }
    };
  }

  /**
   * Initialize tabs - Personal
   */
  private initializeTabsPersonal(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
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
                }
              },
              options: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              // TODO: In the old design input fields were hidden not deactivated. Should we implement "visible: (): boolean => {}"?
              disabled: (): boolean => {
                return !OutbreakModel.canList(this.authUser);
              },
              replace: {
                condition: () => !OutbreakModel.canList(this.authUser),
                html: this.translateService.instant('LNG_USER_FIELD_CANT_SET_ALL_OUTBREAKS')
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
              options: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              // TODO: In the old design input fields were hidden not deactivated. Should we implement "visible: (): boolean => {}"?
              disabled: (): boolean => {
                return !OutbreakModel.canList(this.authUser);
              },
              replace: {
                condition: () => !OutbreakModel.canList(this.authUser),
                html: this.translateService.instant('LNG_USER_FIELD_CANT_SET_ACTIVE_OUTBREAK')
              }
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
                  'LNG_COMMON_LABEL_DETAILS',
                  this.itemData,
                  this.activatedRoute.snapshot.data.user
                );
              }
            },
            visible: () => !this.isCreate
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
      get: (item: UserModel) => item.name,
      link: (item: UserModel) => ['/users', item.id, 'view']
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
        institution: (this.activatedRoute.snapshot.data.institution as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        userRole: (this.activatedRoute.snapshot.data.userRole as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        outbreak: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        team: (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
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
}
