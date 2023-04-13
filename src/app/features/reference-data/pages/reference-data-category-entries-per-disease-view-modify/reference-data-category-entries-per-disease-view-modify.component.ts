import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable, of } from 'rxjs';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import {
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2TabTable
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';

/**
 * Component
 */
@Component({
  selector: 'app-reference-data-category-entries-per-disease-view-modify',
  templateUrl: './reference-data-category-entries-per-disease-view-modify.component.html'
})
export class ReferenceDataCategoryEntriesPerDiseaseViewModifyComponent extends CreateViewModifyComponent<ReferenceDataEntryModel> implements OnDestroy {
  /**
   * Constructor
   */
  constructor(
    protected activatedRoute: ActivatedRoute,
    protected toastV2Service: ToastV2Service,
    protected i18nService: I18nService,
    protected router: Router,
    // #TODO
    protected referenceDataDataService: ReferenceDataDataService,
    authDataService: AuthDataService,
    renderer2: Renderer2,
    redirectService: RedirectService
  ) {
    // parent
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
  protected createNewItem(): ReferenceDataEntryModel {
    return null;
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(_record?: ReferenceDataEntryModel): Observable<ReferenceDataEntryModel> {
    // #TODO
    return of(null);
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {}

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // title
    this.pageTitle = 'LNG_PAGE_REF_DATA_PER_DISEASE_TITLE';
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
    if (ReferenceDataCategoryModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE',
        action: {
          link: ['/reference-data']
        }
      }, {
        label: ReferenceDataCategory.LNG_REFERENCE_DATA_CATEGORY_DISEASE,
        action: {
          link: ['/reference-data', ReferenceDataCategory.LNG_REFERENCE_DATA_CATEGORY_DISEASE]
        }
      });
    }

    // page
    this.breadcrumbs.push({
      label: this.i18nService.instant('LNG_PAGE_REF_DATA_PER_DISEASE_TITLE'),
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
        // reference data per disease
        this.initializeTabsRefDataPerDisease()
      ],

      // create details
      create: null,

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      // #TODO
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: () => {
        // redirect
        this.router.navigate(
          [
            '/reference-data',
            ReferenceDataCategory.LNG_REFERENCE_DATA_CATEGORY_DISEASE
          ]
        );
      }
    };
  }

  /**
   * Initialize tabs - Ref data per disease
   */
  private initializeTabsRefDataPerDisease(): ICreateViewModifyV2TabTable {
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      name: 'ref_data_per_disease',
      label: 'LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE',
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_TREE,
        name: 'allowedDiseaseIds'
      }
    };
  }

  /**
   * Initialize buttons
   */
  private initializeButtons(): ICreateViewModifyV2Buttons {
    return {
      view: {
        link: {
          link: () => ['/reference-data/reference-data-per-disease/view']
        }
      },
      modify: {
        link: {
          link: () => ['/reference-data/reference-data-per-disease/modify']
        },
        visible: () => ReferenceDataEntryModel.canModify(this.authUser)
      },
      createCancel: null,
      viewCancel: {
        link: {
          link: () =>  ['/reference-data', ReferenceDataCategory.LNG_REFERENCE_DATA_CATEGORY_DISEASE]
        }
      },
      modifyCancel: {
        link: {
          link: () => ['/reference-data', ReferenceDataCategory.LNG_REFERENCE_DATA_CATEGORY_DISEASE]
        }
      }
    };
  }

  /**
   * Initialize process data
   */
  private initializeProcessData(): ICreateViewModifyV2CreateOrUpdate {
    // #TODO
    return null;
    // (
    //   type,
    //   data,
    //   finished,
    //   _loading,
    //   _forms
    // ) => {
    //   // set category ID for the new entry
    //   if (type === CreateViewModifyV2ActionType.CREATE) {
    //     data.categoryId = this.category.id;
    //   }
    //
    //   // finished
    //   (type === CreateViewModifyV2ActionType.CREATE ?
    //     this.referenceDataDataService.createEntry(
    //       data
    //     ) :
    //     this.referenceDataDataService.modifyEntry(
    //       this.itemData.id,
    //       data
    //     )
    //   ).pipe(
    //     // handle error
    //     catchError((err) => {
    //       // show error
    //       finished(err, undefined);
    //
    //       // finished
    //       return throwError(err);
    //     }),
    //     switchMap((item) => {
    //       // re-load language tokens
    //       return this.i18nService.loadUserLanguage()
    //         .pipe(
    //           catchError((err) => {
    //             // show error
    //             finished(err, undefined);
    //
    //             // finished
    //             return throwError(err);
    //           }),
    //           map(() => item)
    //         );
    //     }),
    //
    //     // should be the last pipe
    //     takeUntil(this.destroyed$)
    //   ).subscribe((item) => {
    //     // success creating / updating event
    //     this.toastV2Service.success(
    //       type === CreateViewModifyV2ActionType.CREATE ?
    //         'LNG_PAGE_CREATE_REFERENCE_DATA_ENTRY_ACTION_CREATE_ENTRY_SUCCESS_MESSAGE' :
    //         'LNG_PAGE_MODIFY_REFERENCE_DATA_ENTRY_ACTION_MODIFY_ENTRY_SUCCESS_MESSAGE'
    //     );
    //
    //     // finished with success
    //     finished(undefined, item);
    //   });
    // };
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
