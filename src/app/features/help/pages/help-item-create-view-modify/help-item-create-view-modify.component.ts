import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { HelpItemModel } from '../../../../core/models/help-item.model';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import { Observable, throwError } from 'rxjs';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import {
  CreateViewModifyV2ExpandColumnType
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { RequestFilterGenerator } from '../../../../core/helperClasses/request-query-builder';
import { catchError, takeUntil } from 'rxjs/operators';
import {
  CreateViewModifyV2ActionType,
  CreateViewModifyV2MenuType,
  CreateViewModifyV2TabInputType, ICreateViewModifyV2Buttons, ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';

@Component({
  selector: 'app-help-item-create-view-modify',
  templateUrl: './help-item-create-view-modify.component.html'
})

export class HelpItemCreateViewModifyComponent extends CreateViewModifyComponent<HelpItemModel> implements OnDestroy {
  selectedCategory: HelpCategoryModel;

  /**
   * Constructor
   */
  constructor(
    protected router: Router,
    protected activatedRoute: ActivatedRoute,
    protected helpDataService: HelpDataService,
    protected toastV2Service: ToastV2Service,
    protected dialogV2Service: DialogV2Service,
    protected i18nService: I18nService,
    authDataService: AuthDataService,
    renderer2: Renderer2,
    redirectService: RedirectService
  ) {
    super(
      toastV2Service,
      renderer2,
      redirectService,
      activatedRoute,
      authDataService,
      true
    );
    this.selectedCategory = this.activatedRoute.snapshot.data.category;
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
  protected createNewItem(): HelpItemModel {
    return new HelpItemModel();
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: HelpItemModel): Observable<HelpItemModel> {
    return this.helpDataService
      .getHelpItem(
        this.selectedCategory.id,
        record ? record.id : this.activatedRoute.snapshot.params.itemId
      );
  }

  /**
   * Data initialized
   */
  protected initializedData(): void { }

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // add info accordingly to page type
    if (this.isCreate) {
      this.pageTitle = 'LNG_PAGE_CREATE_HELP_ITEM_TITLE';
      this.pageTitleData = undefined;
    } else if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_HELP_ITEM_TITLE';
    } else {
      // view
      this.pageTitle = 'LNG_PAGE_VIEW_HELP_ITEM_TITLE';
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
    this.breadcrumbs.push({
      label: this.i18nService.instant(this.selectedCategory.name),
      action: {
        link: [`/help/categories/${this.selectedCategory.id}/view`]
      }
    });

    // help items list page
    if (HelpItemModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_HELP_ITEMS_TITLE',
        action: {
          link: [`/help/categories/${this.selectedCategory.id}/items`]
        }
      });
    }

    // create / view / modify
    if (this.isCreate) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_CREATE_HELP_ITEM_TITLE',
        action: null
      });
    } else if (this.isModify) {
      this.breadcrumbs.push({
        label: this.i18nService.instant(
          'LNG_PAGE_MODIFY_HELP_ITEM_TITLE', {
            name: this.itemData.title
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.i18nService.instant(
          'LNG_PAGE_VIEW_HELP_ITEM_TITLE', {
            name: this.itemData.title
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
          buttonLabel: this.i18nService.instant('LNG_PAGE_CREATE_HELP_ITEM_ACTION_CREATE_ITEM_BUTTON'),
          message: () => this.i18nService.instant(
            'LNG_STEPPER_FINAL_STEP_TEXT_GENERAL',
            { name: this.itemData.title }
          )
        }
      },

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: (
        data: HelpItemModel,
        extraQueryParams: Params
      ) => {
        // redirect to view
        this.router.navigate(
          [`/help/categories/${data.categoryId}/items/${data.id}/view`], {
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
        'LNG_PAGE_CREATE_HELP_ITEM_TAB_DETAILS_TITLE' :
        'LNG_PAGE_MODIFY_HELP_ITEM_TAB_DETAILS_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: this.isCreate ?
            'LNG_PAGE_CREATE_HELP_ITEM_TAB_DETAILS_TITLE' :
            'LNG_PAGE_MODIFY_HELP_ITEM_TAB_DETAILS_TITLE',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'title',
              placeholder: () => 'LNG_HELP_ITEM_FIELD_LABEL_TITLE',
              description: () => 'LNG_HELP_ITEM_FIELD_LABEL_TITLE_DESCRIPTION',
              value: {
                get: () => this.itemData.title ?
                  this.i18nService.instant(this.itemData.title) :
                  this.itemData.title,
                set: (value) => {
                  this.itemData.title = value;
                }
              },
              validators: {
                required: () => true
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'categoryId',
              placeholder: () => 'LNG_HELP_ITEM_FIELD_LABEL_CATEGORY',
              description: () => 'LNG_HELP_ITEM_FIELD_LABEL_CATEGORY_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.helpCategories as IResolverV2ResponseModel<HelpCategoryModel>).options,
              value: {
                get: () => this.itemData.categoryId,
                set: (value) => {
                  this.itemData.categoryId = value;
                  this.itemData = new HelpItemModel(this.itemData);
                }
              },
              validators: {
                required: () => true
              },
              disabled: () => !this.isModify
            },
            {
              type: CreateViewModifyV2TabInputType.WYSIWYG,
              name: 'content',
              value: {
                get: () => this.itemData.content ?
                  this.i18nService.instant(this.itemData.content) :
                  this.itemData.content,
                set: (value) => {
                  this.itemData.content = value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.TEXTAREA,
              name: 'comment',
              placeholder: () => 'LNG_HELP_ITEM_FIELD_LABEL_COMMENT',
              description: () => 'LNG_HELP_ITEM_FIELD_LABEL_COMMENT_DESCRIPTION',
              value: {
                get: () => this.itemData.comment ?
                  this.i18nService.instant(this.itemData.comment) :
                  this.itemData.comment,
                set: (value) => {
                  this.itemData.comment = value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'page',
              placeholder: () => 'LNG_HELP_ITEM_FIELD_LABEL_PAGE',
              description: () => 'LNG_HELP_ITEM_FIELD_LABEL_PAGE_DESCRIPTION',
              value: {
                get: () => this.itemData.page ?
                  this.i18nService.instant(this.itemData.page) :
                  this.itemData.page,
                set: (value) => {
                  this.itemData.page = value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.NUMBER,
              name: 'order',
              placeholder: () => 'LNG_HELP_ITEM_FIELD_LABEL_ORDER',
              description: () => 'LNG_HELP_ITEM_FIELD_LABEL_ORDER_DESCRIPTION',
              value: {
                get: () => this.itemData.order,
                set: (value) => {
                  this.itemData.order = value;
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
          link: () => [`/help/categories/${this.selectedCategory.id}/items/${this.itemData?.id}/view`]
        }
      },
      modify: {
        link: {
          link: () => [`/help/categories/${this.selectedCategory.id}/items/${this.itemData?.id}/modify`]
        },
        visible: () => HelpItemModel.canModify(this.authUser)
      },
      createCancel: {
        link: {
          link: () => [`/help/categories/${this.selectedCategory.id}/items`]
        }
      },
      viewCancel: {
        link: {
          link: () => [`/help/categories/${this.selectedCategory.id}/items`]
        }
      },
      modifyCancel: {
        link: {
          link: () => [`/help/categories/${this.selectedCategory.id}/items`]
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
      finished
    ) => {
      // create / modify
      (type === CreateViewModifyV2ActionType.CREATE ?
        this.helpDataService.createHelpItem(
          this.selectedCategory.id,
          data
        ) :
        this.helpDataService.modifyHelpItem(
          this.selectedCategory.id,
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
      ).subscribe((helpItem: HelpItemModel) => {
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
          // success creating / updating help item
            this.toastV2Service.success(
              type === CreateViewModifyV2ActionType.CREATE ?
                'LNG_PAGE_CREATE_HELP_ITEM_ACTION_CREATE_HELP_ITEM_SUCCESS_MESSAGE' :
                'LNG_PAGE_MODIFY_HELP_ITEM_ACTION_MODIFY_HELP_ITEM_SUCCESS_MESSAGE'
            );

            // finished with success
            finished(undefined, helpItem);
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
      link: (item: HelpItemModel) => [`/help/categories/${this.selectedCategory.id}/items/${item.id}/view`],
      get: {
        text: (item: HelpItemModel) => item.title ?
          this.i18nService.instant(item.title) :
          item.title
      }
    };
  }

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void {
    this.expandListQueryFields = [
      'id',
      'title',
      'comment',
      'page'
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
            title: RequestFilterGenerator.textContains(
              data.searchBy
            )
          }, {
            comment: RequestFilterGenerator.textContains(
              data.searchBy
            )
          }, {
            page: RequestFilterGenerator.textContains(
              data.searchBy
            )
          }
        ]
      });
    }

    // retrieve data
    this.expandListRecords$ = this.helpDataService
      .getHelpItemsCategoryList(
        this.selectedCategory.id,
        data.queryBuilder
      )
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

}
