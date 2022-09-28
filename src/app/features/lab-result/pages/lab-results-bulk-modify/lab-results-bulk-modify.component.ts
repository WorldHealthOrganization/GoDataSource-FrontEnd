import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { Observable, throwError } from 'rxjs';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { catchError, takeUntil } from 'rxjs/operators';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { CreateViewModifyV2TabInputType, ICreateViewModifyV2Buttons, ICreateViewModifyV2CreateOrUpdate, ICreateViewModifyV2Tab } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { LabResultModel } from '../../../../core/models/lab-result.model';

@Component({
  selector: 'app-lab-results-bulk-modify',
  templateUrl: './lab-results-bulk-modify.component.html'
})
export class LabResultsBulkModifyComponent extends CreateViewModifyComponent<LabResultModel> implements OnDestroy {
  // data
  selectedLabResults: LabResultModel[] = [];

  /**
   * Constructor
   */
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private labResultDataService: LabResultDataService,
    protected toastV2Service: ToastV2Service,
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
  protected createNewItem(): LabResultModel {
    return null;
  }

  /**
  * Retrieve item
  */
  protected retrieveItem(): Observable<LabResultModel> {
    return new Observable<LabResultModel>((subscriber) => {
      // retrieve lab results information
      const qb: RequestQueryBuilder = new RequestQueryBuilder();

      // bring specific lab results
      qb.filter.bySelect(
        'id',
        JSON.parse(this.activatedRoute.snapshot.queryParams.labResultsIds),
        true,
        null
      );

      // retrieve lab results details
      this.labResultDataService
        .getOutbreakLabResults(
          this.selectedOutbreak.id,
          qb
        )
        .pipe(
          catchError((err) => {
            // hide loading
            subscriber.error(err);

            // send error down the road
            return throwError(err);
          })
        )
        .subscribe((labResults: LabResultModel[]) => {
          // lab results data
          this.selectedLabResults = labResults;

          // finished - no item to edit
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
    // add info accordingly to page type
    if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_LAB_RESULTS_LIST_TITLE';
      this.pageTitleData = undefined;
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
      },
      {
        label: 'LNG_PAGE_LIST_LAB_RESULTS_TITLE',
        action: {
          link: ['/lab-results']
        }
      },
      {
        label: 'LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_TITLE',
        action: null
      }
    ];
  }

  /**
  * Initialize tabs
  */
  protected initializeTabs(): void {
    this.tabData = {
      // tabs
      tabs: [
        // Details
        this.initializeDetailTab()
      ],

      // create details
      create: null,

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: () => {
        // update - redirect to view
        this.router.navigate(['/lab-results']);
      }
    };
  }

  /**
   * Details tabs
   */
  private initializeDetailTab(): ICreateViewModifyV2Tab {
    // modify ?
    return {
      // Details
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'details',
      label: 'LNG_COMMON_LABEL_DETAILS',
      sections: [
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: null,
          inputs: [
            // warnings
            {
              type: CreateViewModifyV2TabInputType.LABEL,
              value: {
                get: () => 'LNG_PAGE_LAB_RESULTS_LIST_MODIFY_DATA_INFO_LABEL'
              }
            },

            // results
            {
              type: CreateViewModifyV2TabInputType.LINK_LIST,
              label: {
                get: () => 'LNG_PAGE_MODIFY_LAB_RESULTS_SELECTED_CONTACTS'
              },
              links: this.selectedLabResults.map((result) => ({
                label: result.labName,
                action: {
                  link: () => [
                    '/lab-results',
                    result.person.type === EntityType.CASE ? '/cases' : '/contacts',
                    result.person.id,
                    result.id,
                    'view'
                  ]
                }
              }))
            },

            // inputs
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'result',
              placeholder: () => 'LNG_PAGE_MODIFY_LAB_RESULTS_SELECTED_CONTACTS',
              description: () => 'LNG_PAGE_MODIFY_LAB_RESULTS_SELECTED_CONTACTS_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.labTestResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => null,
                set: () => null
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
      view: null,
      modify: {
        link: {
          link: () => [
            '/lab-results'
          ]
        },
        visible: () => LabResultModel.canList(this.authUser)
      },
      createCancel: null,
      modifyCancel: {
        link: {
          link: () => [
            '/lab-results'
          ]
        },
        visible: () => LabResultModel.canList(this.authUser)
      },
      viewCancel: null
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
      // get selected lab results ids to pass them to qb
      const selectedLabResultsIds: string[] = this.selectedLabResults.map((result: LabResultModel) => {
        return result.id;
      });

      // something went wrong ?
      if (selectedLabResultsIds.length < 1) {
        // show error
        this.toastV2Service.error('LNG_PAGE_MODIFY_LAB_RESULTS_LIST_ERROR_NO_LAB_RESULTS_SELECTED');

        // don't do anything
        return;
      }

      // create query
      const qb: RequestQueryBuilder = new RequestQueryBuilder();
      qb.filter.where({
        id: {
          inq: selectedLabResultsIds
        }
      });

      // do request
      this.labResultDataService
        .bulkModifyLabResults(
          this.selectedOutbreak.id,
          data,
          qb
        )
        .pipe(
          // handle error
          catchError((err) => {
            // show error
            finished(err, undefined);

            // finished
            return throwError(err);
          }),

          // should be the last pipe
          takeUntil(this.destroyed$)
        )
        .subscribe((items) => {
          // success updating event
          this.toastV2Service.success('LNG_PAGE_MODIFY_LAB_RESULTS_LIST_ACTION_MODIFY_MULTIPLE_LAB_RESULTS_SUCCESS_MESSAGE');

          // finished with success
          finished(undefined, items);
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
