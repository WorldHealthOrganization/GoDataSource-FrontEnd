import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { RequestFilterGenerator } from '../../../../core/helperClasses/request-query-builder';
import { catchError, takeUntil } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import {
  CreateViewModifyV2ActionType,
  CreateViewModifyV2MenuType,
  CreateViewModifyV2TabInputType, ICreateViewModifyV2Buttons, ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { HelpItemModel } from '../../../../core/models/help-item.model';
import {
  CreateViewModifyV2ExpandColumnType
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { OutbreakAndOutbreakTemplateHelperService } from '../../../../core/services/helper/outbreak-and-outbreak-template-helper.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
  selector: 'app-help-category-create-view-modify',
  templateUrl: './help-category-create-view-modify.component.html'
})

export class HelpCategoryCreateViewModifyComponent extends CreateViewModifyComponent<HelpCategoryModel> implements OnDestroy {
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
    protected helpDataService: HelpDataService,
    protected dialogV2Service: DialogV2Service
  ) {
    super(
      authDataService,
      activatedRoute,
      renderer2,
      redirectService,
      toastV2Service,
      outbreakAndOutbreakTemplateHelperService,
      true
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
  protected createNewItem(): HelpCategoryModel {
    return new HelpCategoryModel();
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: HelpCategoryModel): Observable<HelpCategoryModel> {
    return this.helpDataService
      .getHelpCategory(
        record ?
          record.id :
          this.activatedRoute.snapshot.params.categoryId
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
      this.pageTitle = 'LNG_PAGE_CREATE_HELP_CATEGORY_TITLE';
      this.pageTitleData = undefined;
    } else if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_HELP_CATEGORY_TITLE';
      this.pageTitleData = {
        name: this.itemData.name
      };
    } else {
      // view
      this.pageTitle = 'LNG_PAGE_VIEW_HELP_CATEGORY_TITLE';
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

    // help categories list page
    if (HelpCategoryModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_HELP_CATEGORIES_TITLE',
        action: {
          link: ['/help/categories']
        }
      });
    }

    // add info accordingly to page type
    if (this.isCreate) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_CREATE_HELP_CATEGORY_TITLE',
        action: null
      });
    } else if (this.isModify) {
      this.breadcrumbs.push({
        label: this.i18nService.instant(
          'LNG_PAGE_MODIFY_HELP_CATEGORY_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.i18nService.instant(
          'LNG_PAGE_VIEW_HELP_CATEGORY_TITLE', {
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
        // Details
        this.initializeTabsDetails()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.i18nService.instant('LNG_PAGE_CREATE_HELP_CATEGORY_ACTION_CREATE_CATEGORY_BUTTON'),
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
        data: HelpCategoryModel,
        extraQueryParams: Params
      ) => {
        // redirect to view
        this.router.navigate(
          [`/help/categories/${data.id}/view`], {
            queryParams: extraQueryParams
          }
        );
      }
    };
  }

  /**
   * Initialize tabs - Details
   */
  private initializeTabsDetails(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'details',
      label: this.isCreate ?
        'LNG_PAGE_CREATE_HELP_CATEGORY_TAB_DETAILS_TITLE' :
        'LNG_PAGE_MODIFY_HELP_CATEGORY_TAB_DETAILS_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: this.isCreate ?
            'LNG_PAGE_CREATE_HELP_CATEGORY_TAB_DETAILS_TITLE' :
            'LNG_PAGE_MODIFY_HELP_CATEGORY_TAB_DETAILS_TITLE',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'name',
              placeholder: () => 'LNG_HELP_CATEGORY_FIELD_LABEL_NAME',
              description: () => 'LNG_HELP_CATEGORY_FIELD_LABEL_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.name ?
                  this.i18nService.instant(this.itemData.name) :
                  this.itemData.name,
                set: (value) => {
                  this.itemData.name = value;
                }
              },
              validators: {
                required: () => true
              }
            },
            {
              type: CreateViewModifyV2TabInputType.NUMBER,
              name: 'order',
              placeholder: () => 'LNG_HELP_CATEGORY_FIELD_LABEL_ORDER',
              description: () => 'LNG_HELP_CATEGORY_FIELD_LABEL_ORDER_DESCRIPTION',
              value: {
                get: () => this.itemData.order,
                set: (value) => {
                  this.itemData.order = value;
                }
              },
              validators: {
                required: () => true
              }
            },
            {
              type: CreateViewModifyV2TabInputType.TEXTAREA,
              name: 'description',
              placeholder: () => 'LNG_HELP_CATEGORY_FIELD_LABEL_DESCRIPTION',
              description: () => 'LNG_HELP_CATEGORY_FIELD_LABEL_DESCRIPTION_DESCRIPTION',
              value: {
                get: () => this.itemData.description ?
                  this.i18nService.instant(this.itemData.description) :
                  this.itemData.description,
                set: (value) => {
                  this.itemData.description = value;
                }
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
          link: () => ['/help/categories', this.itemData?.id, 'view']
        }
      },
      modify: {
        link: {
          link: () => ['/help/categories', this.itemData?.id, 'modify']
        },
        visible: () => HelpCategoryModel.canModify(this.authUser)
      },
      createCancel: {
        link: {
          link: () => ['/help/categories']
        }
      },
      viewCancel: {
        link: {
          link: () => ['/help/categories']
        }
      },
      modifyCancel: {
        link: {
          link: () => ['/help/categories']
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
          },

          // Divider
          {
            type: CreateViewModifyV2MenuType.DIVIDER
          },

          // View People
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_LIST_HELP_CATEGORIES_ACTION_VIEW_HELP_ITEMS_BUTTON',
            action: {
              link: () => ['/help/categories', this.itemData.id, 'items']
            },
            visible: () => HelpItemModel.canList(this.authUser) && HelpCategoryModel.canModify(this.authUser)
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
      finished
    ) => {
      // create / modify
      (type === CreateViewModifyV2ActionType.CREATE ?
        this.helpDataService.createHelpCategory(
          data
        ) :
        this.helpDataService.modifyHelpCategory(
          this.itemData.id,
          data
        )
      ).pipe(
        // handle error
        catchError((err) => {
          // show error
          finished(err, undefined);

          // finished
          return throwError(err);
        })
      ).subscribe((helpCategory: HelpCategoryModel) => {
        this.i18nService.loadUserLanguage()
          .pipe(
            catchError((err) => {
              // show err
              this.toastV2Service.error(err);

              // finished
              finished(err, undefined);

              // send further
              return throwError(err);
            })
          ).subscribe(() => {
            // success creating / updating help category
            this.toastV2Service.success(
              type === CreateViewModifyV2ActionType.CREATE ?
                'LNG_PAGE_CREATE_HELP_CATEGORY_ACTION_CREATE_HELP_CATEGORY_SUCCESS_MESSAGE' :
                'LNG_PAGE_MODIFY_HELP_CATEGORY_ACTION_MODIFY_HELP_CATEGORY_SUCCESS_MESSAGE'
            );

            // finished with success
            finished(undefined, helpCategory);
          });
      });
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {
    this.expandListColumnRenderer = {
      type: CreateViewModifyV2ExpandColumnType.TEXT,
      link: (item: HelpCategoryModel) => ['/help/categories', item.id, 'view'],
      get: {
        text: (item: HelpCategoryModel) => item.name ?
          this.i18nService.instant(item.name) :
          item.name
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
  protected initializeExpandListAdvancedFilters(): void { }

  /**
   * Refresh expand list
   */
  refreshExpandList(data): void {
    // append / remove search
    if (data.searchBy) {
      data.queryBuilder.filter.where({
        or: [
          {
            name: RequestFilterGenerator.textContains(
              data.searchBy
            )
          }, {
            description: RequestFilterGenerator.textContains(
              data.searchBy
            )
          }
        ]
      });
    }

    // retrieve data
    this.expandListRecords$ = this.helpDataService
      .getHelpCategoryList(
        data.queryBuilder
      )
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }
}
