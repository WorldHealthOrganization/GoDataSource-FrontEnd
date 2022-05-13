import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable } from 'rxjs';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { TranslateService } from '@ngx-translate/core';
import {
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { CreateViewModifyV2ExpandColumnType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';

/**
 * Component
 */
@Component({
  selector: 'app-outbreak-create-view-modify',
  templateUrl: './outbreak-create-view-modify.component.html'
})
export class OutbreakCreateViewModifyComponent extends CreateViewModifyComponent<OutbreakModel> implements OnDestroy {
  /**
   * Constructor
   */
  constructor(
    private outbreakDataService: OutbreakDataService,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslateService,
    authDataService: AuthDataService,
    toastV2Service: ToastV2Service,
    renderer2: Renderer2,
    router: Router
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
  protected createNewItem(): OutbreakModel {
    return new OutbreakModel();
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: OutbreakModel): Observable<OutbreakModel> {
    return this.outbreakDataService
      .getOutbreak(
        record ?
          record.id :
          this.activatedRoute.snapshot.params.outbreakId
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
      this.pageTitle = 'LNG_PAGE_CREATE_OUTBREAK_TITLE';
      this.pageTitleData = undefined;
    } else if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_OUTBREAK_LINK_MODIFY';
      this.pageTitleData = {
        name: this.itemData.name
      };
    } else {
      // view
      this.pageTitle = 'LNG_PAGE_VIEW_OUTBREAK_TITLE';
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

    // case list page
    if (OutbreakModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_OUTBREAKS_TITLE',
        action: {
          link: ['/outbreaks']
        }
      });
    }

    // add info accordingly to page type
    if (this.isCreate) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_CREATE_OUTBREAK_TITLE',
        action: null
      });
    } else if (this.isModify) {
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_MODIFY_OUTBREAK_LINK_MODIFY', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_VIEW_OUTBREAK_TITLE', {
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
        // Details
        this.initializeTabsDetails()

        // Map Server
        // #TODO
        // this.initializeMapServers()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.translateService.instant('LNG_PAGE_CREATE_OUTBREAK_ACTION_CREATE_OUTBREAK_BUTTON'),
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
      redirectAfterCreateUpdate: (data: OutbreakModel) => {
        // redirect to view
        this.router.navigate([
          '/outbreaks',
          data.id,
          'view'
        ]);
      }
    };
  }

  /**
   * Initialize tabs - Details
   */
  private initializeTabsDetails(): ICreateViewModifyV2Tab {
    // #TODO
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      label: 'LNG_PAGE_CREATE_CASE_TAB_PERSONAL_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CASE_FIELD_LABEL_DETAILS',
          inputs: [
            // {
            //   type: CreateViewModifyV2TabInputType.TEXT,
            //   name: 'firstName',
            //   placeholder: () => 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
            //   description: () => 'LNG_CASE_FIELD_LABEL_FIRST_NAME_DESCRIPTION',
            //   value: {
            //     get: () => this.itemData.firstName,
            //     set: (value) => {
            //       // set data
            //       this.itemData.firstName = value;
            //
            //       // check for duplicates
            //       this.checkForPersonExistence();
            //     }
            //   },
            //   validators: {
            //     required: () => true
            //   }
            // }
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
          link: () => ['/outbreaks', this.itemData?.id, 'view']
        }
      },
      modify: {
        link: {
          link: () => ['/outbreaks', this.itemData?.id, 'modify']
        },
        visible: () => OutbreakModel.canModify(this.authUser)
      },
      createCancel: {
        link: {
          link: () => ['/outbreaks']
        }
      },
      viewCancel: {
        link: {
          link: () => ['/outbreaks']
        }
      },
      modifyCancel: {
        link: {
          link: () => ['/outbreaks']
        }
      },
      quickActions: {
        options: [
          // #TODO
          // // Record details
          // {
          //   type: CreateViewModifyV2MenuType.OPTION,
          //   label: 'LNG_PAGE_MODIFY_CASE_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
          //   action: {
          //     click: () => {
          //       // show record details dialog
          //       this.dialogV2Service.showRecordDetailsDialog(
          //         'LNG_PAGE_MODIFY_CASE_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
          //         this.itemData,
          //         this.activatedRoute.snapshot.data.user
          //       );
          //     }
          //   },
          //   visible: () => !this.isCreate
          // }
        ]
      }
    };
  }

  /**
   * Initialize process data
   */
  private initializeProcessData(): ICreateViewModifyV2CreateOrUpdate {
    return (
      _type,
      _data,
      _finished,
      _loading,
      _forms
    ) => {
      // #TODO
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {
    this.expandListColumnRenderer = {
      type: CreateViewModifyV2ExpandColumnType.TEXT,
      get: (item: OutbreakModel) => item.name,
      link: (item: OutbreakModel) => ['/outbreaks', item.id, 'view']
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
  protected initializeExpandListAdvancedFilters(): void {
    // #TODO
    // this.expandListAdvancedFilters = CaseModel.generateAdvancedFilters({
    //   authUser: this.authUser,
    //   caseInvestigationTemplate: () => this.selectedOutbreak.caseInvestigationTemplate,
    //   options: {
    //     gender: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
    //     occupation: (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
    //     risk: (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
    //     classification: (this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
    //     yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
    //     outcome: (this.activatedRoute.snapshot.data.outcome as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
    //     clusterLoad: (finished) => {
    //       finished(this.activatedRoute.snapshot.data.cluster);
    //     },
    //     pregnancy: (this.activatedRoute.snapshot.data.pregnancy as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
    //     vaccine: (this.activatedRoute.snapshot.data.vaccine as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
    //     vaccineStatus: (this.activatedRoute.snapshot.data.vaccineStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
    //     user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
    //   }
    // });
  }

  /**
   * Refresh expand list
   */
  refreshExpandList(_data): void {
    // #TODO
    // // append / remove search
    // if (data.searchBy) {
    //   data.queryBuilder.filter.where({
    //     or: [
    //       {
    //         firstName: RequestFilterGenerator.textContains(
    //           data.searchBy
    //         )
    //       }, {
    //         lastName: RequestFilterGenerator.textContains(
    //           data.searchBy
    //         )
    //       }, {
    //         middleName: RequestFilterGenerator.textContains(
    //           data.searchBy
    //         )
    //       }, {
    //         visualId: RequestFilterGenerator.textContains(
    //           data.searchBy
    //         )
    //       }
    //     ]
    //   });
    // }
    //
    // // retrieve data
    // this.expandListRecords$ = this.caseDataService
    //   .getCasesList(
    //     this.selectedOutbreak.id,
    //     data.queryBuilder
    //   );
  }
}
