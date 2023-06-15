import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { HelpItemModel } from '../../../../core/models/help-item.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { Observable } from 'rxjs';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { CreateViewModifyV2TabInputType, ICreateViewModifyV2Buttons, ICreateViewModifyV2Tab } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { CreateViewModifyV2ExpandColumnType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { RequestFilterGenerator } from '../../../../core/helperClasses/request-query-builder';
import { takeUntil } from 'rxjs/operators';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
  selector: 'app-view-help-item',
  templateUrl: './view-help.component.html'
})
export class ViewHelpComponent extends CreateViewModifyComponent<HelpItemModel> implements OnDestroy {
  // data
  private _helpItemTitle: string;
  private _helpItemContent: string;

  // path data
  private _itemId: string;
  private _categoryId: string;

  /**
   * Constructor
   */
  constructor(
    protected activatedRoute: ActivatedRoute,
    protected toastV2Service: ToastV2Service,
    private helpDataService: HelpDataService,
    private i18nService: I18nService,
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

    // retrieve path data
    this._itemId = this.activatedRoute.snapshot.params.itemId;
    this._categoryId = this.activatedRoute.snapshot.params.categoryId;
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
    return null;
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: HelpItemModel): Observable<HelpItemModel> {
    // view other help item?
    if (
      record?.id &&
      record?.categoryId
    ) {
      this._itemId = record?.id;
      this._categoryId = record?.categoryId;
    }

    // retrieve data
    return new Observable((subscriber) => {
      this.helpDataService
        .getHelpItem(this._categoryId, this._itemId)
        .subscribe((helpItemData) => {
          // process data
          this._helpItemTitle = helpItemData?.title ?? '';
          this._helpItemContent = this.i18nService.instant(helpItemData?.content) ?? '';

          // finish
          subscriber.next(null);
          subscriber.complete();
        });
    });
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {}

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // view help item
    this.pageTitle = 'LNG_PAGE_VIEW_HELP_ITEM_TITLE';
    this.pageTitleData = null;
  }

  /**
   * Initialize tabs
   */
  protected initializeTabs(): void {
    this.tabData = {
      // tabs
      tabs: [
        // Personal
        this.initializeTabsDetails()
      ],

      // create details
      create: undefined,

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: undefined,
      redirectAfterCreateUpdate: undefined
    };
  }

  /**
   * Initialize tabs - Details
   */
  private initializeTabsDetails(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'details',
      label: 'LNG_COMMON_LABEL_DETAILS',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_COMMON_LABEL_DETAILS',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.LABEL,
              value: {
                get: () => this._helpItemTitle
              }
            },
            {
              type: CreateViewModifyV2TabInputType.WYSIWYG,
              name: '_helpItemContent',
              value: {
                get: () => this._helpItemContent,
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
      view: undefined,
      modify: undefined,
      createCancel: undefined,
      viewCancel: {
        link: {
          link: () => ['/help']
        }
      },
      modifyCancel: undefined,
      quickActions: undefined
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {
    this.expandListColumnRenderer = {
      type: CreateViewModifyV2ExpandColumnType.TEXT,
      link: (item: HelpItemModel) => ['/help/categories', item.categoryId, 'items', item.id, 'view-global'],
      get: {
        text: (item: HelpItemModel) => this.i18nService.instant(item.title)
      }
    };
  }

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void {
    this.expandListQueryFields = [
      'id',
      'title'
    ];
  }

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {
    this.expandListAdvancedFilters = HelpItemModel.generateAdvancedFilters({
      options: {
        helpCategory: (this.activatedRoute.snapshot.data.helpCategory as IResolverV2ResponseModel<HelpCategoryModel>).options
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
        title: RequestFilterGenerator.textContains(
          data.searchBy
        )
      });
    }

    // only approved
    data.queryBuilder.filter.where({ approved: true }, true);

    // retrieve data
    this.expandListRecords$ = this.helpDataService.getHelpItemsList(data.queryBuilder)
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs() {
    // reset
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/account/my-profile']
        }
      },
      {
        label: 'LNG_PAGE_GLOBAL_HELP_TITLE',
        action: {
          link: ['/help']
        }
      },
      // current page breadcrumb
      {
        label: 'LNG_PAGE_VIEW_HELP_ITEM_TITLE',
        action: null
      }
    ];
  }

  /**
   * Initialize breadcrumb infos
   */
  protected initializeBreadcrumbInfos(): void {}
}
