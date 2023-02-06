import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { TransmissionChainBarsService } from '../../services/transmission-chain-bars.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { TransmissionChainBarsDataService } from '../../services/transmission-chain-bars.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Subscription, throwError } from 'rxjs';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { catchError } from 'rxjs/operators';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { TransmissionChainModel } from '../../../../core/models/transmission-chain.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { IV2ActionMenuLabel, V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { IV2LoadingDialogHandler } from '../../../../shared/components-v2/app-loading-dialog-v2/models/loading-dialog-v2.model';
import { Constants } from '../../../../core/models/constants';
import { V2AdvancedFilter, V2AdvancedFilterComparatorOptions, V2AdvancedFilterComparatorType, V2AdvancedFilterType } from '../../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { moment } from '../../../../core/helperClasses/x-moment';
import { EntityType } from '../../../../core/models/entity-type';
import { IV2SideDialogAdvancedFiltersResponse } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { ConvertHtmlToPDFStep, DomService } from '../../../../core/services/helper/dom.service';

@Component({
  selector: 'app-transmission-chain-bars',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './transmission-chain-bars.component.html',
  styleUrls: ['./transmission-chain-bars.component.less']
})
export class TransmissionChainBarsComponent implements OnInit, OnDestroy {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  // constants
  TransmissionChainModel = TransmissionChainModel;
  Constants = Constants;

  // authenticated user
  authUser: UserModel;
  // selected Outbreak
  selectedOutbreak: OutbreakModel;
  outbreakSubscriber: Subscription;
  // query builder for fetching data
  queryBuilder: RequestQueryBuilder = new RequestQueryBuilder();
  // show loading while fetching data and building the graph
  loadingData: boolean = true;
  // do we have data to draw the graph?
  noData: boolean = false;
  // loading indicator
  loadingDialog: IV2LoadingDialogHandler;
  // define legend colors
  legendColors: any;

  graphData: any;
  cellWidth: number = 91;

  @ViewChild('chart', { static: true }) chartContainer: ElementRef;

  // Map of center token names
  centerTokenToNameMap: {
    [token: string]: string
  } = {};

  // quick actions
  quickActions: IV2ActionMenuLabel;

  // advanced filters
  advancedFilters: V2AdvancedFilter[];

  /**
   * Constructor
   */
  constructor(
    private authDataService: AuthDataService,
    private transmissionChainBarsService: TransmissionChainBarsService,
    private transmissionChainBarsDataService: TransmissionChainBarsDataService,
    private outbreakDataService: OutbreakDataService,
    private dialogV2Service: DialogV2Service,
    private i18nService: I18nService,
    protected toastV2Service: ToastV2Service,
    protected activatedRoute: ActivatedRoute,
    private domService: DomService
  ) {}

  /**
   * Component initialized
   */
  ngOnInit() {
    // init color rectangles
    this.legendColors = {
      rectCD: `<div class="legend-rect" style="background-color: ${this.transmissionChainBarsService.graphConfig.isolationColor};"></div>`,
      rectLAB: `<div class="legend-rect" style="background-color: ${this.transmissionChainBarsService.graphConfig.labResultColor};"></div>`,
      rectOUT: `<div class="legend-rect" style="background-color: ${this.transmissionChainBarsService.graphConfig.dateOutcomeColor};"></div>`,
      rectB: `<div class="legend-rect" style="background-color: ${this.transmissionChainBarsService.graphConfig.dateOutcomeBurialColor};"></div>`
    };

    // authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    // outbreak
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        this.selectedOutbreak = selectedOutbreak;
        this.loadGraph();
      });

    // initialize page breadcrumbs
    this.initializeBreadcrumbs();

    // quick actions
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_COMMON_BUTTON_QUICK_ACTIONS',
      visible: () => TransmissionChainModel.canExportBarChart(this.authUser),
      menuOptions: [
        // Export map
        {
          label: {
            get: () => 'LNG_PAGE_TRANSMISSION_CHAIN_BARS_EXPORT_CHAIN'
          },
          action: {
            click: () => {
              this.exportChain();
            }
          },
          visible: () => TransmissionChainModel.canExportBarChart(this.authUser)
        }
      ]
    };

    // advanced filters
    this.advancedFilters = [{
      type: V2AdvancedFilterType.RANGE_DATE,
      field: 'date',
      label: 'LNG_PAGE_TRANSMISSION_CHAIN_BARS_FIELD_LABEL_DATE',
      allowedComparators: [
        _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.RANGE_DATE], { value: V2AdvancedFilterComparatorType.BETWEEN }),
        _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.RANGE_DATE], { value: V2AdvancedFilterComparatorType.BEFORE }),
        _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.RANGE_DATE], { value: V2AdvancedFilterComparatorType.AFTER })
      ],
      filterBy: (
        qb,
        filter
      ) => {
        // determine operator & value
        const fromValue = filter.value.startDate ? moment(filter.value.startDate).toISOString() : null;
        const toValue = filter.value.endDate ? moment(filter.value.endDate).toISOString() : null;
        let operator: string;
        let valueToCompare: any;
        if (filter.comparator.value === V2AdvancedFilterComparatorType.BETWEEN) {
          operator = 'between';
          valueToCompare = [fromValue, toValue];
        } else if (filter.comparator.value === V2AdvancedFilterComparatorType.AFTER) {
          operator = 'gte';
          valueToCompare = fromValue;
        } else {
          operator = 'lte';
          valueToCompare = toValue;
        }

        // condition
        qb.filter
          .where({
            or: [
              {
                type: EntityType.CASE,
                dateOfOnset: {
                  [operator]: valueToCompare
                }
              }, {
                type: EntityType.EVENT,
                date: {
                  [operator]: valueToCompare
                }
              }
            ]
          });
      }
    }, {
      type: V2AdvancedFilterType.LOCATION_SINGLE,
      field: 'locationId',
      label: 'LNG_ADDRESS_FIELD_LABEL_LOCATION',
      filterBy: (
        qb,
        filter
      ) => {
        qb.filter
          .where({
            or: [
              {
                type: EntityType.CASE,
                'addresses.parentLocationIdFilter': {
                  inq: [filter.value]
                }
              }, {
                type: EntityType.EVENT,
                'address.parentLocationIdFilter': {
                  inq: [filter.value]
                }
              }
            ]
          });
      }
    }, {
      type: V2AdvancedFilterType.RANGE_DATE,
      field: 'isolationDate',
      label: 'LNG_PAGE_TRANSMISSION_CHAIN_BARS_FILTERS_HOSPITALISATION_ISOLATION',
      allowedComparators: [
        _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.RANGE_DATE], { value: V2AdvancedFilterComparatorType.BETWEEN }),
        _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.RANGE_DATE], { value: V2AdvancedFilterComparatorType.BEFORE }),
        _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.RANGE_DATE], { value: V2AdvancedFilterComparatorType.AFTER })
      ],
      filterBy: (
        qb,
        filter
      ) => {
        // determine operator & value
        const startDate = filter.value.startDate ? moment(filter.value.startDate).toISOString() : null;
        const endDate = filter.value.endDate ? moment(filter.value.endDate).toISOString() : null;

        // must have isolation start date or end date
        qb.filter
          .where({
            'or': [
              {
                'dateRanges.startDate': {
                  '$ne': null
                }
              },
              {
                'dateRanges.endDate': {
                  '$ne': null
                }
              }
            ]
          });

        // start date
        if (startDate) {
          qb.filter
            .where({
              'or': [
                {
                  'dateRanges.endDate': {
                    'gte': startDate
                  }
                },
                {
                  'dateRanges.endDate': null
                }
              ]
            });
        }

        if (endDate) {
          qb.filter
            .where({
              'or': [
                {
                  'and': [
                    {
                      'dateOfOnset': {
                        'lte': endDate
                      }
                    },
                    {
                      'dateRanges.startDate': null
                    }
                  ]
                },
                {
                  'and': [
                    {
                      'dateRanges.startDate': {
                        'lte': endDate
                      }
                    },
                    {
                      'dateRanges.startDate': {
                        '$ne': null
                      }
                    }
                  ]
                }
              ]
            });
        }
      }
    }, {
      type: V2AdvancedFilterType.MULTISELECT,
      field: 'isolationCenterName',
      label: 'LNG_CASE_FIELD_LABEL_DATE_RANGE_CENTER_NAME',
      options: (this.activatedRoute.snapshot.data.dateRangeCenter as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
      allowedComparators: [
        _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.MULTISELECT], { value: V2AdvancedFilterComparatorType.NONE })
      ],
      filterBy: (
        qb,
        filter
      ) => {
        qb.filter
          .bySelect(
            'dateRanges.centerName',
            filter.value,
            true,
            null
          );
      }
    }, {
      type: V2AdvancedFilterType.MULTISELECT,
      field: 'caseClassification',
      label: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
      options: (this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
      allowedComparators: [
        _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.MULTISELECT], { value: V2AdvancedFilterComparatorType.NONE })
      ],
      filterBy: (
        qb,
        filter
      ) => {
        qb.filter
          .bySelect(
            'classification',
            filter.value,
            true,
            null
          );
      }
    }, {
      type: V2AdvancedFilterType.MULTISELECT,
      field: 'caseOutcome',
      label: 'LNG_PAGE_TRANSMISSION_CHAIN_BARS_FILTERS_CASE_OUTCOME',
      options: (this.activatedRoute.snapshot.data.outcome as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
      allowedComparators: [
        _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.MULTISELECT], { value: V2AdvancedFilterComparatorType.NONE })
      ],
      filterBy: (
        qb,
        filter
      ) => {
        qb.filter
          .bySelect(
            'outcomeId',
            filter.value,
            true,
            null
          );
      }
    }];
  }

  /**
   * Component destroyed
   */
  ngOnDestroy() {
    // release graph data
    this.transmissionChainBarsService.destroy();

    // release subscriber
    if (this.outbreakSubscriber) {
      this.outbreakSubscriber.unsubscribe();
      this.outbreakSubscriber = null;
    }
  }

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs() {
    // reset
    this.breadcrumbs = [{
      label: 'LNG_COMMON_LABEL_HOME',
      action: {
        link: DashboardModel.canViewDashboard(this.authUser) ?
          ['/dashboard'] :
          ['/account/my-profile']
      }
    }];

    // current page
    this.breadcrumbs.push({
      label: 'LNG_PAGE_TRANSMISSION_CHAIN_BARS_TITLE',
      action: null
    });
  }

  /**
   * (Re)Build the graph
   */
  private loadGraph() {
    if (!this.selectedOutbreak) {
      return;
    }

    // load data
    this.loadingData = true;

    // retrieve center names & chain bar data
    this.transmissionChainBarsDataService
      .getTransmissionChainBarsData(this.selectedOutbreak.id, this.queryBuilder)
      .subscribe((graphData) => {
        // map center names
        (this.activatedRoute.snapshot.data.dateRangeCenter as IResolverV2ResponseModel<ReferenceDataEntryModel>).options.forEach((center) => {
          this.centerTokenToNameMap[center.value] = this.i18nService.instant(center.label);
        });

        // graph data
        if (graphData.personsOrder.length > 0) {
          this.noData = false;

          this.graphData = graphData;
          this.redrawGraph();
        } else {
          this.noData = true;
        }

        // finished loading data
        this.loadingData = false;
      });
  }

  /**
   * Redraw graph
   */
  redrawGraph() {
    // there is no point in drawing graph if we have no data
    if (this.graphData === undefined) {
      return;
    }

    // draw graph
    this.transmissionChainBarsService.drawGraph(
      this.chartContainer.nativeElement,
      this.graphData,
      this.centerTokenToNameMap, {
        cellWidth: this.cellWidth
      }
    );
  }

  /**
   * Changed cell width
   */
  cellWidthChanged(cellWidth: number) {
    this.cellWidth = cellWidth;
    this.redrawGraph();
  }

  /**
   * Display loading dialog
   */
  private showLoadingDialog() {
    // loading dialog already visible ?
    if (this.loadingDialog) {
      return;
    }

    // show
    this.loadingDialog = this.dialogV2Service.showLoadingDialog();
  }

  /**
   * Hide loading dialog
   */
  private closeLoadingDialog() {
    if (this.loadingDialog) {
      this.loadingDialog.close();
      this.loadingDialog = null;
    }
  }

  /**
   * Export visible chain as PDF
   */
  exportChain() {
    // display loading
    this.showLoadingDialog();

    // convert dom container to image
    this.domService
      .convertHTML2PDF(
        this.chartContainer.nativeElement,
        `${this.i18nService.instant('LNG_PAGE_TRANSMISSION_CHAIN_BARS_TITLE')}.pdf`, {
          splitFactor: 1,
          splitType: 'grid',
          onclone: (_document, element) => {
            // disable overflow scrolls to render everything, otherwise it won't scroll children, and it won't export everything
            const dateSection = element.querySelector<HTMLElement>('.gd-dates-section');
            const dateSectionContainer = dateSection.querySelector<HTMLElement>('.gd-dates-section-container');
            const chartSection = element.querySelector<HTMLElement>('.gd-entities-section');
            const chartSectionHeader = chartSection.querySelector<HTMLElement>('.gd-entities-section-header');
            const chartSectionContainer = chartSection.querySelector<HTMLElement>('.gd-entities-section-container');
            if (
              dateSection &&
              dateSectionContainer &&
              chartSection &&
              chartSectionHeader &&
              chartSectionContainer
            ) {
              element.style.whiteSpace = 'nowrap';
              element.style.width = 'fit-content';
              element.style.height = 'fit-content';
              dateSection.style.height = 'fit-content';
              dateSectionContainer.style.overflow = 'visible';
              dateSectionContainer.style.height = 'fit-content';
              chartSection.style.width = 'fit-content';
              chartSection.style.height = 'fit-content';
              chartSectionHeader.style.overflow = 'visible';
              chartSectionHeader.style.width = 'fit-content';
              chartSectionContainer.style.overflow = 'visible';
              chartSectionContainer.style.width = 'fit-content';
              chartSectionContainer.style.height = 'fit-content';
            }
          }
        },
        (step) => {
          // determine percent
          let percent: number;
          switch (step) {
            case ConvertHtmlToPDFStep.INITIALIZED:
              percent = 5;
              break;
            case ConvertHtmlToPDFStep.CONVERTING_HTML_TO_PDF:
              percent = 50;
              break;
            case ConvertHtmlToPDFStep.EXPORTING_PDF:
              percent = 99;
              break;
          }

          // update dialog percent
          this.loadingDialog.message({
            message: `${percent}%`
          });
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
  }

  /**
   * Filter
   */
  advancedFilterBy(response: IV2SideDialogAdvancedFiltersResponse): void {
    // create custom query builder
    this.queryBuilder = response.queryBuilder;

    // rebuild graph
    this.loadGraph();
  }
}
