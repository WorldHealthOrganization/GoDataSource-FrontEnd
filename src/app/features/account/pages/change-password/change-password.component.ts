import { Component, OnDestroy, Renderer2, ViewEncapsulation } from '@angular/core';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { Observable } from 'rxjs';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { CreateViewModifyV2TabInputType, ICreateViewModifyV2Buttons, ICreateViewModifyV2Tab } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { AppMessages } from '../../../../core/enums/app-messages.enum';

@Component({
  selector: 'app-change-password',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.less']
})
export class ChangePasswordComponent extends CreateViewModifyComponent<UserModel> implements OnDestroy {
  // #TODO
  // passwordChange = new PasswordChangeModel();
  // passwordConfirmModel: string;
  // passwordChanged: boolean = false;

  /**
   * Constructor
   */
  constructor(
    protected userDataService: UserDataService,
    protected toastV2Service: ToastV2Service,
    router: Router,
    activatedRoute: ActivatedRoute,
    authDataService: AuthDataService,
    renderer2: Renderer2
  ) {
    // parent
    super(
      activatedRoute,
      authDataService,
      toastV2Service,
      renderer2,
      router
    );

    // display you must change password ?
    if (this.authUser.passwordChange) {
      this.toastV2Service.notice(
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
    this.toastV2Service.hide(AppMessages.APP_MESSAGE_MUST_CHANGE_PASSWORD);
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
   * Initialize tabs
   */
  protected initializeTabs(): void {
    this.tabData = {
      // tabs
      tabs: [
        this.initializeTabsPersonal()
      ],

      // create details
      // - change password doesn't require create
      create: undefined,

      // buttons
      buttons: this.initializeButtons(),

      // update
      createOrUpdate: undefined, // this.initializeProcessData(),
      redirectAfterCreateUpdate: undefined
    };
  }

  /**
   * Initialize tabs - Personal
   */
  private initializeTabsPersonal(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
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
                get: () => '',
                set: () => {}
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
                get: () => '',
                set: () => {}
              },
              validators: {
                required: () => true
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

  // #TODO
//   changePassword(form: NgForm) {
//     if (form.valid) {
//       const dirtyFields: any[] = form.value;
//
//       const data = this.modelHelperService.getModelInstance(PasswordChangeModel, dirtyFields);
//
//       // try to authenticate the user
//       this.userDataService
//         .changePassword(data)
//         .pipe(
//           catchError((err) => {
//             this.toastV2Service.error(err);
//             return throwError(err);
//           })
//         )
//         .subscribe(() => {
//           const refreshUserAndShowMessage = () => {
//             this.authDataService
//               .reloadAndPersistAuthUser()
//               .subscribe((authenticatedUser) => {
//                 // in case user was forced to change password, then we don't need to redirect him since he has to set security questions
//                 const redirect: boolean = !this.authUser.passwordChange;
//
//                 // update user settings
//                 this.authUser = authenticatedUser.user;
//
//                 // display message
//                 this.toastV2Service.success('LNG_PAGE_CHANGE_PASSWORD_ACTION_CHANGE_PASSWORD_SUCCESS_MESSAGE');
//
//                 // refresh page
//                 if (redirect) {
//                   this.router.navigate(['/']);
//                 }
//               });
//           };
//
//           // check if user was required to change password
//           if (this.authUser.passwordChange) {
//             // update user details so next time it's not required to change its password again
//             this.userDataService
//               .modifyUser(this.authUser.id, { passwordChange: false })
//               .subscribe(() => {
//                 // refresh user data
//                 refreshUserAndShowMessage();
//                 // set passwordChanged to true so we can display the security questions notification.
//                 this.passwordChanged = true;
//
//               });
//           } else {
//             // refresh user data
//             refreshUserAndShowMessage();
//           }
//
//         });
//     }
//   }
}
