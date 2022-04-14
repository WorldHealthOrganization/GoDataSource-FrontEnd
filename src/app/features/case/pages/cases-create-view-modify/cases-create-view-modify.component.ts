import { Component, OnDestroy } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { CaseModel } from '../../../../core/models/case.model';
import { Observable } from 'rxjs';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { TranslateService } from '@ngx-translate/core';
import { CreateViewModifyV2TabInputType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';

/**
 * Component
 */
@Component({
  selector: 'app-cases-create-view-modify',
  templateUrl: './cases-create-view-modify.component.html'
})
export class CasesCreateViewModifyComponent extends CreateViewModifyComponent<CaseModel> implements OnDestroy {
  /**
   * Constructor
   */
  constructor(
    protected activatedRoute: ActivatedRoute,
    protected caseDataService: CaseDataService,
    protected translateService: TranslateService,
    authDataService: AuthDataService,
    toastV2Service: ToastV2Service
  ) {
    super(
      activatedRoute,
      authDataService,
      toastV2Service
    );
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    super.onDestroy();
  }

  /**
   * Create new item model if needed
   */
  protected createNewItem(): CaseModel {
    return new CaseModel();
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(): Observable<CaseModel> {
    return this.caseDataService
      .getCase(
        this.selectedOutbreak.id,
        this.activatedRoute.snapshot.params.caseId
      );
  }

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // add info accordingly to page type
    if (this.isCreate) {
      this.pageTitle = 'LNG_PAGE_CREATE_CASE_TITLE';
      this.pageTitleData = undefined;
    } else if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_CASE_TITLE';
      this.pageTitleData = {
        name: this.itemData.name
      };
    } else {
      // view
      this.pageTitle = 'LNG_PAGE_VIEW_CASE_TITLE';
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
            ['/version']
        }
      }
    ];

    // case list page
    if (CaseModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CASES_TITLE',
        action: {
          link: ['/cases']
        }
      });
    }

    // add info accordingly to page type
    if (this.isCreate) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_CREATE_CASE_TITLE',
        action: null
      });
    } else if (this.isModify) {
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_MODIFY_CASE_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_VIEW_CASE_TITLE', {
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
    this.tabs = [{
      type: CreateViewModifyV2TabInputType.TAB,
      label: 'LNG_PAGE_CREATE_CASE_TAB_PERSONAL_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CASE_FIELD_LABEL_DETAILS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.TEXT,
            name: 'firstName',
            placeholder: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
            description: 'LNG_CASE_FIELD_LABEL_FIRST_NAME_DESCRIPTION',
            value: {
              get: () => this.itemData.firstName,
              set: (value) => {
                this.itemData.firstName = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.TEXT,
            name: 'middleName',
            placeholder: 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME',
            description: 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME_DESCRIPTION',
            value: {
              get: () => this.itemData.middleName,
              set: (value) => {
                this.itemData.middleName = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.TEXT,
            name: 'lastName',
            placeholder: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
            description: 'LNG_CASE_FIELD_LABEL_LAST_NAME_DESCRIPTION',
            value: {
              get: () => this.itemData.lastName,
              set: (value) => {
                this.itemData.lastName = value;
              }
            }
          }]
        },

        // Documents
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CASE_FIELD_LABEL_DOCUMENTS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.LIST,
            inputs: [{
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'type',
              placeholder: 'LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_TYPE',
              description: 'LNG_DOCUMENT_FIELD_LABEL_DOCUMENT_TYPE_DESCRIPTION',
              options: [],
              value: {
                // #TODO
                get: () => null,
                set: () => {}
              }
            }]
          }]
        }
      ]
    }];
  }
}
