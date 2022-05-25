import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { UserModel } from '../../../../core/models/user.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { CreateViewModifyV2TabInputType, ICreateViewModifyV2Buttons, ICreateViewModifyV2CreateOrUpdate, ICreateViewModifyV2Tab } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { SecurityQuestionModel } from '../../../../core/models/securityQuestion.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { catchError } from 'rxjs/operators';
import { RedirectService } from '../../../../core/services/helper/redirect.service';

@Component({
  selector: 'app-set-security-questions',
  templateUrl: './set-security-questions.component.html'
})
export class SetSecurityQuestionsComponent extends CreateViewModifyComponent<UserModel> implements OnDestroy {

  // used to keep changed data
  private _answers: string[] = [
    '',
    ''
  ];

  /**
   * Constructor
   */
  constructor(
    protected activatedRoute: ActivatedRoute,
    protected authDataService: AuthDataService,
    protected userDataService: UserDataService,
    protected router: Router,
    toastV2Service: ToastV2Service,
    renderer2: Renderer2,
    redirectService: RedirectService
  ) {
    // parent
    super(
      activatedRoute,
      authDataService,
      toastV2Service,
      renderer2,
      redirectService
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
    this.pageTitle = 'LNG_PAGE_SET_SECURITY_QUESTIONS_TITLE';
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
      label: 'LNG_PAGE_SET_SECURITY_QUESTIONS_TITLE',
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
        this.initializeTabsSetSecurityQuestions()
      ],

      // create details
      // - doesn't require create
      create: undefined,

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      modifyGetAllNotOnlyDirtyFields: true,
      redirectAfterCreateUpdate: () => {
        // redirect to view
        this.router.navigate([ '/account/my-profile' ]);
      }
    };
  }

  /**
   * Initialize tabs - Personal
   */
  private initializeTabsSetSecurityQuestions(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      label: 'LNG_PAGE_SET_SECURITY_QUESTIONS_TAB_SECURITY_QUESTIONS_TITLE',
      sections: [
        // Set security questions
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_PAGE_SET_SECURITY_QUESTIONS_TAB_SECURITY_QUESTIONS_TITLE',
          inputs: [
            // question 1
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'securityQuestions[0][question]',
              placeholder: () => 'LNG_PAGE_SET_SECURITY_QUESTIONS_FIELD_LABEL_QUESTION_1',
              options: (this.activatedRoute.snapshot.data.securityQuestions as IResolverV2ResponseModel<SecurityQuestionModel>).options,
              value: {
                get: () => this.authUser.securityQuestions ?
                  this.authUser.securityQuestions[0]?.question :
                  undefined,
                set: (value) => {
                  // initialize if necessary
                  if (!this.authUser.securityQuestions) {
                    this.authUser.securityQuestions = [
                      new SecurityQuestionModel(),
                      new SecurityQuestionModel()
                    ];
                  }

                  // set value
                  this.authUser.securityQuestions[0].question = value;
                }
              },
              validators: {
                required: () => true,
                validateOther: () => 'securityQuestions[1][question]'
              }
            },

            // answer 1
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'securityQuestions[0][answer]',
              placeholder: () => 'LNG_PAGE_SET_SECURITY_QUESTIONS_FIELD_LABEL_ANSWER_1',
              value: {
                get: () => this._answers[0],
                set: (value) => {
                  this._answers[0] = value;
                }
              },
              validators: {
                required: () => true
              },
              noValueLabel: () => '***'
            },

            // question 2
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'securityQuestions[1][question]',
              placeholder: () => 'LNG_PAGE_SET_SECURITY_QUESTIONS_FIELD_LABEL_QUESTION_2',
              options: (this.activatedRoute.snapshot.data.securityQuestions as IResolverV2ResponseModel<SecurityQuestionModel>).options,
              value: {
                get: () => this.authUser.securityQuestions ?
                  this.authUser.securityQuestions[1]?.question :
                  undefined,
                set: (value) => {
                  // initialize if necessary
                  if (!this.authUser.securityQuestions) {
                    this.authUser.securityQuestions = [
                      new SecurityQuestionModel(),
                      new SecurityQuestionModel()
                    ];
                  }

                  // set value
                  this.authUser.securityQuestions[1].question = value;
                }
              },
              validators: {
                required: () => true,
                notEqualValidator: () => ({
                  input: 'securityQuestions[0][question]',
                  err: 'LNG_FORM_VALIDATION_ERROR_NOT_EQUAL_QUESTION_VALUE'
                })
              }
            },

            // answer 2
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'securityQuestions[1][answer]',
              placeholder: () => 'LNG_PAGE_SET_SECURITY_QUESTIONS_FIELD_LABEL_ANSWER_2',
              value: {
                get: () => this._answers[1],
                set: (value) => {
                  this._answers[1] = value;
                }
              },
              validators: {
                required: () => true
              },
              noValueLabel: () => '***'
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
      modify: {
        link: {
          link: () => ['/account', 'set-security-questions', 'modify']
        },
        visible: () => UserModel.canModifyOwnAccount(this.authUser)
      },
      createCancel: undefined,
      viewCancel: {
        link: {
          link: () => ['/account', 'my-profile']
        }
      },
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
      data,
      finished
    ) => {
      // modify
      this.userDataService
        .modifyUser(
          this.authUser.id,
          data
        )
        .pipe(
          catchError((err) => {
            // show error
            finished(err, undefined);

            // finished
            return throwError(err);
          })
        )
        .subscribe(() => {
          this.authDataService
            .reloadAndPersistAuthUser()
            .subscribe((_authenticatedUser) => {
              // display message
              this.toastV2Service.success('LNG_PAGE_SET_SECURITY_QUESTIONS_ACTION_SAVE_SUCCESS_MESSAGE');

              // hide loading & redirect
              finished(undefined, null);
            });
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
