import { Component, OnInit, ViewChild } from '@angular/core';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { DomService } from '../../../../core/services/helper/dom.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { GanttChartDelayOnsetDashletComponent } from '../../components/gantt-chart-delay-onset-dashlet/gantt-chart-delay-onset-dashlet.component';
import { throwError } from 'rxjs';
import { Constants } from '../../../../core/models/constants';
import { catchError } from 'rxjs/operators';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { GanttChartModel } from '../../../../core/models/gantt-chart.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { IV2ActionMenuLabel, V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { V2AdvancedFilter, V2AdvancedFilterType } from '../../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { IV2LoadingDialogHandler } from '../../../../shared/components-v2/app-loading-dialog-v2/models/loading-dialog-v2.model';
import { ActivatedRoute } from '@angular/router';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2SideDialogAdvancedFiltersResponse, IV2SideDialogConfigButtonType, IV2SideDialogConfigInputToggle, V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';

@Component({
  selector: 'app-gantt-chart',
  templateUrl: './gantt-chart.component.html'
})
export class GanttChartComponent extends ConfirmOnFormChanges implements OnInit {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  // selected outbreak ID
  outbreakId: string;

  globalFilterDate: Moment;
  globalFilterLocationId: string;
  loadingDialog: IV2LoadingDialogHandler;

  @ViewChild('ganttChart') private ganttChart: GanttChartDelayOnsetDashletComponent;

  ganttChartTypesOptions: ILabelValuePairModel[];
  ganttChartType: any;

  // constants
  Constants = Constants;

  // authenticated user
  private _authUser: UserModel;

  // quick actions
  quickActions: IV2ActionMenuLabel;

  // advanced filters
  advancedFilters: V2AdvancedFilter[];

  /**
     * Constructor
     */
  constructor(
    private domService: DomService,
    private i18nService: I18nService,
    private toastV2Service: ToastV2Service,
    private dialogV2Service: DialogV2Service,
    authDataService: AuthDataService,
    activatedRoute: ActivatedRoute
  ) {
    // parent
    super();

    // get the authenticated user
    this._authUser = authDataService.getAuthenticatedUser();

    // get data
    this.ganttChartTypesOptions = (activatedRoute.snapshot.data.ganttChartType as IResolverV2ResponseModel<ILabelValuePairModel>).options
      .filter((record) => {
        switch (record.value) {
          case Constants.GANTT_CHART_TYPES.GANTT_CHART_LAB_TEST.value:
            return GanttChartModel.canViewDelayOnsetLabTesting(this._authUser);
          case Constants.GANTT_CHART_TYPES.GANTT_CHART_HOSPITALIZATION_ISOLATION.value:
            return GanttChartModel.canViewDelayOnsetHospitalization(this._authUser);
          default:
            // not supported
            return false;
        }
      });
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // select visible chart accordingly to user rights
    if (GanttChartModel.canViewDelayOnsetLabTesting(this._authUser)) {
      this.ganttChartType = Constants.GANTT_CHART_TYPES.GANTT_CHART_LAB_TEST.value;
    } else if (GanttChartModel.canViewDelayOnsetHospitalization(this._authUser)) {
      this.ganttChartType = Constants.GANTT_CHART_TYPES.GANTT_CHART_HOSPITALIZATION_ISOLATION.value;
    } else {
      // NOT SUPPORTED
    }

    // initialize breadcrumbs
    this.initializeBreadcrumbs();

    // quick actions
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_COMMON_BUTTON_QUICK_ACTIONS',
      visible: () => (this.ganttChartType === Constants.GANTT_CHART_TYPES.GANTT_CHART_LAB_TEST.value && GanttChartModel.canExportDelayOnsetLabTesting(this._authUser)) ||
        (this.ganttChartType === Constants.GANTT_CHART_TYPES.GANTT_CHART_HOSPITALIZATION_ISOLATION.value && GanttChartModel.canExportDelayOnsetHospitalization(this._authUser)),
      menuOptions: [
        // Export
        {
          label: {
            get: () => 'LNG_PAGE_DASHBOARD_GANTT_CHART_REPORT_LABEL'
          },
          action: {
            click: () => {
              this.generateGanttChartReport();
            }
          },
          visible: () => (this.ganttChartType === Constants.GANTT_CHART_TYPES.GANTT_CHART_LAB_TEST.value && GanttChartModel.canExportDelayOnsetLabTesting(this._authUser)) ||
            (this.ganttChartType === Constants.GANTT_CHART_TYPES.GANTT_CHART_HOSPITALIZATION_ISOLATION.value && GanttChartModel.canExportDelayOnsetHospitalization(this._authUser))
        }
      ]
    };

    // advanced filters
    this.advancedFilters = [{
      type: V2AdvancedFilterType.LOCATION_SINGLE,
      field: 'locationId',
      label: 'LNG_GLOBAL_FILTERS_FIELD_LABEL_LOCATION',
      filterBy: (_qb, filter) => {
        // set filters
        this.globalFilterLocationId = filter.value;
      }
    }, {
      type: V2AdvancedFilterType.DATE,
      field: 'date',
      label: 'LNG_GLOBAL_FILTERS_FIELD_LABEL_DATE',
      filterBy: (_qb, filter) => {
        // set filters
        this.globalFilterDate = moment(filter.value);
      }
    }];
  }

  /**
     * Initialize breadcrumbs
     */
  initializeBreadcrumbs() {
    // reset
    this.breadcrumbs = [{
      label: 'LNG_COMMON_LABEL_HOME',
      action: {
        link: DashboardModel.canViewDashboard(this._authUser) ?
          ['/dashboard'] :
          ['/account/my-profile']
      }
    }];

    // current page
    this.breadcrumbs.push({
      label: 'LNG_PAGE_GANTT_CHART_TITLE',
      action: null
    });
  }

  /**
   * Generate Gantt chart report - image will be exported as pdf
   */
  generateGanttChartReport() {
    // check if we have data to export
    if (
      !this.ganttChart ||
      !this.ganttChart.hasData()
    ) {
      this.toastV2Service.error('LNG_PAGE_DASHLET_GANTT_CHART_NO_DATA_LABEL');
      return;
    }

    // show configuration dialog
    this.dialogV2Service.showSideDialog({
      // title
      title: {
        get: () => 'LNG_PAGE_GANTT_CHART_REPORT_FORMAT'
      },

      // inputs
      hideInputFilter: true,
      inputs: [
        {
          type: V2SideDialogConfigInputType.TOGGLE,
          value: false,
          name: 'exportFormat',
          options: [
            {
              label: 'LNG_PAGE_GANTT_CHART_REPORT_FORMAT_MULTI_PAGE',
              value: false
            },
            {
              label: 'LNG_PAGE_GANTT_CHART_REPORT_FORMAT_SINGLE_PAGE',
              value: true
            }
          ]
        }
      ],

      // buttons
      bottomButtons: [
        {
          label: 'LNG_COMMON_BUTTON_EXPORT',
          type: IV2SideDialogConfigButtonType.OTHER,
          color: 'primary',
          key: 'save'
        }, {
          type: IV2SideDialogConfigButtonType.CANCEL,
          label: 'LNG_COMMON_BUTTON_CANCEL',
          color: 'text'
        }
      ]
    }).subscribe((response) => {
      // cancelled ?
      if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
        return;
      }

      // determine export format
      const exportAsSinglePage: boolean = (response.data.map.exportFormat as IV2SideDialogConfigInputToggle).value as boolean;

      // close popup
      response.handler.hide();

      // show loading
      this.showLoadingDialog();

      // export
      setTimeout(() => {
        this.domService
          .convertHTML2PDF(
            document.querySelector(
              this.ganttChartType === Constants.GANTT_CHART_TYPES.GANTT_CHART_HOSPITALIZATION_ISOLATION.value ?
                'app-gantt-chart-delay-onset-hospitalization-dashlet' :
                'app-gantt-chart-delay-onset-dashlet'
            ),
            `${this.i18nService.instant('LNG_PAGE_GANTT_CHART_REPORT_LABEL')}.pdf`, {
              splitType: exportAsSinglePage ?
                'grid' :
                'auto',
              onclone: (_document, element) => {
                // disable overflow scrolls to render everything, otherwise it won't scroll children, and it won't export everything
                const container = element.querySelector<HTMLElement>('#gantt-svg-root');
                if (container) {
                  container.style.overflow = 'visible';
                }
              }
            }
          )
          .pipe(
            catchError((err) => {
              this.toastV2Service.error(err);
              this.closeLoadingDialog();
              return throwError(err);
            })
          )
          .subscribe(() => {
            // finished
            this.closeLoadingDialog();
          });

      }, 200);
    });
  }

  /**
     * Display loading dialog
     */
  showLoadingDialog() {
    this.loadingDialog = this.dialogV2Service.showLoadingDialog();
  }

  /**
     * Hide loading dialog
     */
  closeLoadingDialog() {
    if (this.loadingDialog) {
      this.loadingDialog.close();
      this.loadingDialog = null;
    }
  }

  /**
   * Filter
   */
  advancedFilterBy(response: IV2SideDialogAdvancedFiltersResponse): void {
    // reset date ?
    if (!response.filtersApplied?.appliedFilters.find((item) => item.filter.uniqueKey === 'dateLNG_GLOBAL_FILTERS_FIELD_LABEL_DATE')) {
      this.globalFilterDate = undefined;
    }

    // reset location ?
    if (!response.filtersApplied?.appliedFilters.find((item) => item.filter.uniqueKey === 'locationIdLNG_GLOBAL_FILTERS_FIELD_LABEL_LOCATION')) {
      this.globalFilterLocationId = undefined;
    }
  }
}
