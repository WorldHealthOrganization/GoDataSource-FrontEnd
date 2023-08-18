import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { UserModel } from '../../../../core/models/user.model';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { Observable, throwError } from 'rxjs';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { CreateViewModifyV2TabInputType, ICreateViewModifyV2Buttons, ICreateViewModifyV2CreateOrUpdate, ICreateViewModifyV2Tab } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { AppMessages } from '../../../../core/enums/app-messages.enum';
import { PasswordChangeModel } from '../../../../core/models/password-change.model';
import { catchError } from 'rxjs/operators';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { CreateViewModifyHelperService } from '../../../../core/services/helper/create-view-modify-helper.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent extends CreateViewModifyComponent<UserModel> implements OnDestroy {
  // data
  private _passwordChange = new PasswordChangeModel();

  /**
   * Constructor
   */
  constructor(
    protected authDataService: AuthDataService,
    protected activatedRoute: ActivatedRoute,
    protected renderer2: Renderer2,
    protected createViewModifyHelperService: CreateViewModifyHelperService,
    protected userDataService: UserDataService,
    protected dialogV2Service: DialogV2Service,
    protected router: Router
  ) {
    // parent
    super(
      authDataService,
      activatedRoute,
      renderer2,
      createViewModifyHelperService
    );

    // display you must change password ?
    if (this.authUser.passwordChange) {
      this.createViewModifyHelperService.toastV2Service.notice(
        'LNG_PAGE_CHANGE_PASSWORD_DESCRIPTION',
        undefined,
        AppMessages.APP_MESSAGE_MUST_CHANGE_PASSWORD
      );
    }
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();

    // remove global notifications
    this.createViewModifyHelperService.toastV2Service.hide(AppMessages.APP_MESSAGE_MUST_CHANGE_PASSWORD);
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
    this.pageTitle = 'LNG_PAGE_CHANGE_PASSWORD_TITLE';
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

    // my profile
    this.breadcrumbs.push({
      label: this.authUser.name,
      action: {
        link: ['/account/my-profile']
      }
    });

    // view / edit profile
    this.breadcrumbs.push({
      label: 'LNG_PAGE_CHANGE_PASSWORD_TITLE',
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
        this.initializeTabsChangePassword()
      ],

      // create details
      // - change password doesn't require create
      create: undefined,

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: () => {
        // redirect to view
        this.router.navigate([ '/account/my-profile' ]);
      }
    };
  }

  /**
   * Initialize tabs - Personal
   */
  private initializeTabsChangePassword(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'change_password',
      label: 'LNG_PAGE_RESET_PASSWORD_TAB_CHANGE_PASSWORD_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_PAGE_RESET_PASSWORD_TAB_CHANGE_PASSWORD_TITLE',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.PASSWORD,
              name: 'oldPassword',
              placeholder: () => 'LNG_PAGE_RESET_PASSWORD_FIELD_LABEL_CURRENT_PASSWORD',
              description: () => 'LNG_PAGE_RESET_PASSWORD_FIELD_LABEL_CURRENT_PASSWORD_DESCRIPTION',
              value: {
                get: () => this._passwordChange.oldPassword,
                set: (value) => {
                  this._passwordChange.oldPassword = value;
                }
              },
              validators: {
                required: () => true
              }
            },
            {
              type: CreateViewModifyV2TabInputType.PASSWORD,
              name: 'newPassword',
              placeholder: () => 'LNG_PAGE_RESET_PASSWORD_FIELD_LABEL_NEW_PASSWORD',
              description: () => 'LNG_PAGE_RESET_PASSWORD_FIELD_LABEL_NEW_PASSWORD_DESCRIPTION',
              value: {
                get: () => this._passwordChange.newPassword,
                set: (value) => {
                  this._passwordChange.newPassword = value;
                }
              },
              validators: {
                required: () => true,
                minlength: () => 12,
                validateOther: () => 'newPasswordConfirm'
              }
            },
            {
              type: CreateViewModifyV2TabInputType.PASSWORD,
              name: 'newPasswordConfirm',
              placeholder: () => 'LNG_PAGE_RESET_PASSWORD_FIELD_LABEL_CONFIRM_NEW_PASSWORD',
              description: () => 'LNG_PAGE_RESET_PASSWORD_FIELD_LABEL_CONFIRM_NEW_PASSWORD_DESCRIPTION',
              value: {
                get: () => '',
                set: () => {}
              },
              validators: {
                required: () => true,
                equalValidator: () => ({
                  input: 'newPassword',
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
      view: undefined,
      modify: undefined,
      createCancel: undefined,
      viewCancel: undefined,
      modifyCancel: {
        link: {
          link: () => ['/account', 'my-profile']
        }
      },
      quickActions: undefined
    };
  }

  /**
   * Initialize process data
   */
  private initializeProcessData(): ICreateViewModifyV2CreateOrUpdate {
    return (
      _type,
      _data,
      finished,
      loading,
      forms
    ) => {
      // try to authenticate the user
      this.userDataService
        .changePassword(this._passwordChange)
        .pipe(
          catchError((err) => {
            // show error
            finished(err, undefined);

            // finished
            return throwError(err);
          })
        )
        .subscribe(() => {
          // refresh user information
          const refreshUserAndShowMessage = (askForSecurityQuestions: boolean) => {
            this.authDataService
              .reloadAndPersistAuthUser()
              .subscribe((_authenticatedUser) => {
                // display message
                this.createViewModifyHelperService.toastV2Service.success('LNG_PAGE_CHANGE_PASSWORD_ACTION_CHANGE_PASSWORD_SUCCESS_MESSAGE');

                // redirect
                if (!askForSecurityQuestions) {
                  // hide loading & redirect
                  finished(undefined, null);
                } else {
                  // mark pristine
                  forms.markFormsAsPristine();

                  // hide loading
                  loading.hide();

                  // ask what to do next
                  this.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_ATTENTION_REQUIRED'
                      },
                      message: {
                        get: () => 'LNG_PAGE_CHANGE_PASSWORD_SECURITY_QUESTIONS_NOTIFICATION'
                      }
                    },
                    yesLabel: 'LNG_PAGE_CHANGE_PASSWORD_SECURITY_QUESTIONS_BUTTON',
                    cancelLabel: 'LNG_PAGE_CHANGE_PASSWORD_LATER_BUTTON'
                  }).subscribe((response) => {
                    // canceled ?
                    if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                      // redirect to profile
                      this.tabData.redirectAfterCreateUpdate(
                        null,
                        undefined
                      );

                      // finished
                      return;
                    }

                    // redirect to set questions
                    this.router.navigate(['/account/set-security-questions']);
                  });
                }
              });
          };

          // check if user was required to change password
          if (this.authUser.passwordChange) {
            // update user details so next time it's not required to change its password again
            this.userDataService
              .modifyUser(this.authUser.id, { passwordChange: false })
              .subscribe(() => {
                // refresh user data
                refreshUserAndShowMessage(true);
              });
          } else {
            // refresh user data
            refreshUserAndShowMessage(false);
          }
        });
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
