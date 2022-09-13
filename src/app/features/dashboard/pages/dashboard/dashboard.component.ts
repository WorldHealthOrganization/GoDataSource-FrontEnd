import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { IV2ActionMenuLabel, V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { V2AdvancedFilterComparatorOptions, V2AdvancedFilterComparatorType, V2AdvancedFilterType } from '../../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { ActivatedRoute } from '@angular/router';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { Constants } from '../../../../core/models/constants';
import { SavedFilterData, SavedFilterDataAppliedFilter } from '../../../../core/models/saved-filters.model';
import * as _ from 'lodash';
import { Moment, moment } from '../../../../core/helperClasses/x-moment';
import { RequestFilterOperator, RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { ExportDataExtension, ExportDataMethod } from '../../../../core/services/helper/models/dialog-v2.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Subscription } from 'rxjs/internal/Subscription';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { TranslateService } from '@ngx-translate/core';
import * as momentOriginal from 'moment';
import { DomService } from '../../../../core/services/helper/dom.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ImportExportDataService } from '../../../../core/services/data/import-export.data.service';
import * as FileSaver from 'file-saver';
import { AppCasesKpiDashletComponent } from '../../components/app-cases-kpi-dashlet/app-cases-kpi-dashlet.component';
import { AppContactsKpiDashletComponent } from '../../components/app-contacts-kpi-dashlet/app-contacts-kpi-dashlet.component';
import { AppCotKpiDashletComponent } from '../../components/app-cot-kpi-dashlet/app-cot-kpi-dashlet.component';
import * as domtoimage from 'dom-to-image';
import { IV2SideDialogConfigButtonType, IV2SideDialogConfigInputToggle, V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  // children dashlets
  @ViewChild('kpiSection', { static: false }) private _kpiSection: ElementRef;
  @ViewChild('kpiCases', { static: false }) private _kpiCases: AppCasesKpiDashletComponent;
  @ViewChild('kpiContacts', { static: false }) private _kpiContacts: AppContactsKpiDashletComponent;
  @ViewChild('kpiCOT', { static: false }) private _kpiCOT: AppCotKpiDashletComponent;

  // quick actions
  quickActions: IV2ActionMenuLabel;

  // used to filter dashlets
  globalFilterDate: string | Moment = moment();
  globalFilterLocationId: string = undefined;
  globalFilterClassificationId: string[] = [];

  // applied filters
  private _advancedFiltersApplied: SavedFilterData = new SavedFilterData({
    appliedFilterOperator: RequestFilterOperator.AND,
    appliedFilters: [
      // date
      new SavedFilterDataAppliedFilter({
        filter: {
          uniqueKey: 'dateLNG_GLOBAL_FILTERS_FIELD_LABEL_DATE'
        },
        comparator: V2AdvancedFilterComparatorType.DATE,
        value: this.globalFilterDate
      }),

      // location
      new SavedFilterDataAppliedFilter({
        filter: {
          uniqueKey: 'locationIdLNG_GLOBAL_FILTERS_FIELD_LABEL_LOCATION'
        },
        comparator: V2AdvancedFilterComparatorType.LOCATION,
        value: this.globalFilterLocationId
      }),

      // classification
      new SavedFilterDataAppliedFilter({
        filter: {
          uniqueKey: 'classificationIdLNG_GLOBAL_FILTERS_FIELD_LABEL_CLASSIFICATION'
        },
        comparator: V2AdvancedFilterComparatorType.NONE,
        value: this.globalFilterClassificationId
      })
    ]
  });

  // authenticated user details
  private _authUser: UserModel;

  // selected outbreak
  private _determiningOutbreakSubscriber: Subscription;
  private _outbreakSubscriber: Subscription;
  private _selectedOutbreak: OutbreakModel;
  loadingSelectedOutbreak: boolean;
  public get isOutbreakSelected(): boolean {
    return !!this._selectedOutbreak?.id;
  }

  // visible dashlets
  visibleDashlets: {
    CaseSummary: boolean,
    CasesPerLocation: boolean,
    Hospitalized: boolean,
    COTHistogram: boolean,
    EPICurveClassification: boolean,
    EPICurveOutcome: boolean,
    EPICurveReporting: boolean,
    FollowUpOverview: boolean,
    ContactStatus: boolean,
    KPICases: boolean,
    KPIContacts: boolean,
    KPICOT: boolean
  } = {
      CaseSummary: false,
      CasesPerLocation: false,
      Hospitalized: false,
      COTHistogram: false,
      EPICurveClassification: false,
      EPICurveOutcome: false,
      EPICurveReporting: false,
      FollowUpOverview: false,
      ContactStatus: false,
      KPICases: false,
      KPIContacts: false,
      KPICOT: false
    };

  /**
   * Constructor
   */
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private dialogV2Service: DialogV2Service,
    private activatedRoute: ActivatedRoute,
    private outbreakDataService: OutbreakDataService,
    private translateService: TranslateService,
    private domService: DomService,
    private toastV2Service: ToastV2Service,
    private importExportDataService: ImportExportDataService,
    authDataService: AuthDataService
  ) {
    // authenticated user
    this._authUser = authDataService.getAuthenticatedUser();

    // determine visible dashlets
    this.visibleDashlets = {
      // Old Dashlets
      CaseSummary: DashboardModel.canViewCaseSummaryDashlet(this._authUser),
      CasesPerLocation: DashboardModel.canViewCasePerLocationLevelDashlet(this._authUser),
      Hospitalized: DashboardModel.canViewCaseHospitalizedPieChartDashlet(this._authUser),
      COTHistogram: DashboardModel.canViewCotSizeHistogramDashlet(this._authUser),
      EPICurveClassification: DashboardModel.canViewEpiCurveStratifiedByClassificationDashlet(this._authUser),
      EPICurveOutcome: DashboardModel.canViewEpiCurveStratifiedByOutcomeDashlet(this._authUser),
      EPICurveReporting: DashboardModel.canViewEpiCurveStratifiedByClassificationOverReportTimeDashlet(this._authUser),
      FollowUpOverview: DashboardModel.canViewContactFollowUpReportDashlet(this._authUser),
      ContactStatus: DashboardModel.canViewContactStatusReportDashlet(this._authUser),

      // KPI - cases
      KPICases: DashboardModel.canViewCaseDeceasedDashlet(this._authUser) ||
        DashboardModel.canViewCaseHospitalizedDashlet(this._authUser) ||
        DashboardModel.canViewCaseWithLessThanXCotactsDashlet(this._authUser) ||
        DashboardModel.canViewNewCasesInPreviousXDaysAmongKnownContactsDashlet(this._authUser) ||
        DashboardModel.canViewCasesRefusingTreatmentDashlet(this._authUser) ||
        DashboardModel.canViewNewCasesFromKnownCOTDashlet(this._authUser) ||
        DashboardModel.canViewCasesWithPendingLabResultsDashlet(this._authUser) ||
        DashboardModel.canViewCasesNotIdentifiedThroughContactsDashlet(this._authUser),

      // KPI - contacts
      KPIContacts: DashboardModel.canViewContactsPerCaseMeanDashlet(this._authUser) ||
        DashboardModel.canViewContactsPerCaseMedianDashlet(this._authUser) ||
        DashboardModel.canViewContactsFromFollowUpsDashlet(this._authUser) ||
        DashboardModel.canViewContactsLostToFollowUpsDashlet(this._authUser) ||
        DashboardModel.canViewContactsNotSeenInXDaysDashlet(this._authUser) ||
        DashboardModel.canViewContactsBecomeCasesDashlet(this._authUser) ||
        DashboardModel.canViewContactsSeenDashlet(this._authUser) ||
        DashboardModel.canViewContactsWithSuccessfulFollowUpsDashlet(this._authUser),

      // KPI - COT
      KPICOT: DashboardModel.canViewIndependentCOTDashlet(this._authUser) ||
        DashboardModel.canViewContactsNotSeenInXDaysDashlet(this._authUser) ||
        DashboardModel.canViewContactsBecomeCasesDashlet(this._authUser)
    };
  }

  /**
   * Component initialized
   */
  ngOnInit(): void {
    // subscribe to outbreak changes
    this._outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        // update outbreak
        this._selectedOutbreak = selectedOutbreak;

        // found selected outbreak ?
        if (this._selectedOutbreak?.id) {
          // initialize quick actions
          this.initializeQuickActions();

          // redraw data
          this.detectChanges();
        }
      });

    // subscribe to outbreak determining changes
    this._determiningOutbreakSubscriber = this.outbreakDataService
      .getDeterminingOutbreakSubject()
      .subscribe((determining) => {
        // determining ?
        this.loadingSelectedOutbreak = determining;

        // redraw data
        this.detectChanges();
      });
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // selected outbreak
    if (this._outbreakSubscriber) {
      this._outbreakSubscriber.unsubscribe();
      this._outbreakSubscriber = undefined;
    }

    // determining outbreak
    if (this._determiningOutbreakSubscriber) {
      this._determiningOutbreakSubscriber.unsubscribe();
      this._determiningOutbreakSubscriber = undefined;
    }
  }

  /**
   * Refresh template
   */
  detectChanges(): void {
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Initialize quick actions
   */
  initializeQuickActions(): void {
    // initialize quick actions
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_PAGE_DASHBOARD_REPORTS_BUTTON_LABEL',
      visible: () => DashboardModel.canExportCaseClassificationPerLocationReport(this._authUser) ||
        DashboardModel.canExportContactFollowUpSuccessRateReport(this._authUser) ||
        DashboardModel.canViewEpiCurveStratifiedByClassificationDashlet(this._authUser) ||
        DashboardModel.canViewEpiCurveStratifiedByOutcomeDashlet(this._authUser) ||
        DashboardModel.canViewEpiCurveStratifiedByClassificationOverReportTimeDashlet(this._authUser) ||
        (
          DashboardModel.canExportKpi(this._authUser) && (
            this.visibleDashlets.KPICases ||
            this.visibleDashlets.KPIContacts ||
            this.visibleDashlets.KPICOT
          )
        ),
      menuOptions: [
        // Export case classification per location report
        {
          label: {
            get: () => 'LNG_PAGE_DASHBOARD_CASES_BY_CLASSIFICATION_LOCATION_REPORT_LABEL'
          },
          action: {
            click: () => {
              // initialization
              const qb = new RequestQueryBuilder();

              // date
              if (this.globalFilterDate) {
                qb.filter.byDateRange(
                  'dateOfReporting', {
                    endDate: moment(this.globalFilterDate).endOf('day').format()
                  }
                );
              }

              // location
              if (this.globalFilterLocationId) {
                qb.filter.byEquality(
                  'addresses.parentLocationIdFilter',
                  this.globalFilterLocationId
                );
              }

              // classification
              // since we display all classifications in the exported file, it would be strange to filter them by classification
              // so there is nothing to filter here
              // if (this.globalFilterClassificationId) {
              //     qb.filter.bySelect(
              //         'classification',
              //         this.globalFilterClassificationId,
              //         false,
              //         null
              //     );
              // }

              // export
              this.dialogV2Service.showExportData({
                title: {
                  get: () => 'LNG_PAGE_DASHBOARD_CASES_BY_CLASSIFICATION_LOCATION_REPORT_LABEL'
                },
                export: {
                  url: `/outbreaks/${this._selectedOutbreak.id}/cases/per-classification-per-location-level-report/download/`,
                  async: false,
                  method: ExportDataMethod.GET,
                  fileName: `${this.translateService.instant('LNG_PAGE_DASHBOARD_CASES_BY_CLASSIFICATION_LOCATION_REPORT_LABEL')} - ${momentOriginal().format('YYYY-MM-DD HH:mm')}`,
                  queryBuilder: qb,
                  allow: {
                    types: [
                      ExportDataExtension.PDF
                    ]
                  }
                }
              });
            }
          },
          visible: () => DashboardModel.canExportCaseClassificationPerLocationReport(this._authUser)
        },

        // Export contact follow-up success rate
        {
          label: {
            get: () => 'LNG_PAGE_DASHBOARD_CONTACTS_FOLLOWUP_SUCCESS_RATE_REPORT_LABEL'
          },
          action: {
            click: () => {
              // initialization
              const qb = new RequestQueryBuilder();

              // date filters
              if (this.globalFilterDate) {
                // pdf report
                qb.filter.flag(
                  'dateOfFollowUp',
                  moment(this.globalFilterDate).startOf('day').format()
                );

                // same as list view
                qb.filter.byDateRange(
                  'dateOfReporting', {
                    endDate: moment(this.globalFilterDate).endOf('day').format()
                  }
                );
              }

              // location
              if (this.globalFilterLocationId) {
                qb.filter.byEquality(
                  'addresses.parentLocationIdFilter',
                  this.globalFilterLocationId
                );
              }

              // classification
              // there is no need to filter by classification since this api filters contacts and not cases...
              // if (this.globalFilterClassificationId) {
              //     qb.filter.bySelect(
              //         'classification',
              //         this.globalFilterClassificationId,
              //         false,
              //         null
              //     );
              // }

              // export
              this.dialogV2Service.showExportData({
                title: {
                  get: () => 'LNG_PAGE_DASHBOARD_CONTACTS_FOLLOWUP_SUCCESS_RATE_REPORT_LABEL'
                },
                export: {
                  url: `/outbreaks/${this._selectedOutbreak.id}/contacts/per-location-level-tracing-report/download/`,
                  async: false,
                  method: ExportDataMethod.GET,
                  fileName: `${this.translateService.instant('LNG_PAGE_DASHBOARD_CONTACTS_FOLLOWUP_SUCCESS_RATE_REPORT_LABEL')} - ${momentOriginal().format('YYYY-MM-DD HH:mm')}`,
                  queryBuilder: qb,
                  allow: {
                    types: [
                      ExportDataExtension.PDF
                    ]
                  }
                }
              });
            }
          },
          visible: () => DashboardModel.canExportContactFollowUpSuccessRateReport(this._authUser)
        },

        // Export EPI - Classification
        {
          label: {
            get: () => 'LNG_PAGE_DASHBOARD_EPI_CURVE_CLASSIFICATION_TITLE'
          },
          toolTip: this.translateService.instant('LNG_PAGE_DASHBOARD_EPI_CURVE_CLASSIFICATION_TITLE'),
          action: {
            click: () => {
              this.getEpiCurveDashlet('app-epi-curve-dashlet svg');
            }
          },
          visible: () => DashboardModel.canViewEpiCurveStratifiedByClassificationDashlet(this._authUser)
        },

        // Export EPI - Outcome
        {
          label: {
            get: () => 'LNG_PAGE_DASHBOARD_EPI_CURVE_OUTCOME_TITLE'
          },
          toolTip: this.translateService.instant('LNG_PAGE_DASHBOARD_EPI_CURVE_OUTCOME_TITLE'),
          action: {
            click: () => {
              this.getEpiCurveDashlet('app-epi-curve-outcome-dashlet svg');
            }
          },
          visible: () => DashboardModel.canViewEpiCurveStratifiedByOutcomeDashlet(this._authUser)
        },

        // Export EPI - Reporting Classification
        {
          label: {
            get: () => 'LNG_PAGE_DASHBOARD_EPI_CURVE_REPORTING_TITLE'
          },
          toolTip: this.translateService.instant('LNG_PAGE_DASHBOARD_EPI_CURVE_REPORTING_TITLE'),
          action: {
            click: () => {
              this.getEpiCurveDashlet('app-epi-curve-reporting-dashlet svg');
            }
          },
          visible: () => DashboardModel.canViewEpiCurveStratifiedByClassificationOverReportTimeDashlet(this._authUser)
        },

        // Export KPI
        {
          label: {
            get: () => 'LNG_PAGE_DASHBOARD_KPIS_REPORT_LABEL'
          },
          action: {
            click: () => {
              // display error message if we try to render empty item
              if (
                !this._kpiCases.dashlet.expanded &&
                !this._kpiContacts.dashlet.expanded &&
                !this._kpiCOT.dashlet.expanded
              ) {
                // err
                this.toastV2Service.error('LNG_PAGE_DASHBOARD_KPIS_ELEMENTS_NOT_VISIBLE_ERROR_MSG');

                // finished
                return;
              }

              // convert dom container to image
              const loading = this.dialogV2Service.showLoadingDialog();
              setTimeout(() => {
                (domtoimage as any)
                  .toPng(
                    this._kpiSection.nativeElement, {
                      filter: (node) => {
                        return node.tagName !== 'A';
                      }
                    }
                  )
                  .then((dataUrl) => {
                    const dataBase64 = dataUrl.replace('data:image/png;base64,', '');
                    this.importExportDataService
                      .exportImageToPdf({ image: dataBase64, responseType: 'blob', splitFactor: 1 })
                      .pipe(
                        catchError((err) => {
                          this.toastV2Service.error(err);
                          loading.close();
                          return throwError(err);
                        })
                      )
                      .subscribe((blob) => {
                        this.downloadFile(blob, 'LNG_PAGE_DASHBOARD_KPIS_REPORT_LABEL');
                        loading.close();
                      });
                  });
              });
            }
          },
          visible: () => DashboardModel.canExportKpi(this._authUser) && (
            this.visibleDashlets.KPICases ||
            this.visibleDashlets.KPIContacts ||
            this.visibleDashlets.KPICOT
          )
        }
      ]
    };
  }

  /**
   * Show advanced filters
   */
  showAdvancedFilters(): void {
    // show advanced filters dialog
    this.dialogV2Service
      .showAdvancedFiltersDialog(
        Constants.APP_PAGE.DASHBOARD.value,
        [
          // Date
          {
            type: V2AdvancedFilterType.DATE,
            field: 'date',
            label: 'LNG_GLOBAL_FILTERS_FIELD_LABEL_DATE',
            filterBy: (_qb, filter) => {
              this.globalFilterDate = filter.value;
            }
          },

          // Location
          {
            type: V2AdvancedFilterType.LOCATION_SINGLE,
            field: 'locationId',
            label: 'LNG_GLOBAL_FILTERS_FIELD_LABEL_LOCATION',
            optional: true,
            clearable: true,
            filterBy: (_qb, filter) => {
              this.globalFilterLocationId = filter.value ?
                filter.value :
                undefined;
            }
          },

          // Classification
          {
            type: V2AdvancedFilterType.MULTISELECT,
            field: 'classificationId',
            label: 'LNG_GLOBAL_FILTERS_FIELD_LABEL_CLASSIFICATION',
            options: (this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            optional: true,
            allowedComparators: [
              _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.MULTISELECT], { value: V2AdvancedFilterComparatorType.NONE })
            ],
            filterBy: (_qb, filter) => {
              this.globalFilterClassificationId = filter.value;
            }
          }
        ],
        this._advancedFiltersApplied,
        {
          operatorHide: true,
          disableAdd: true,
          disableReset: true,
          disableDelete: true
        }
      )
      .subscribe((response) => {
        // cancelled ?
        if (!response) {
          return;
        }

        // set data
        this._advancedFiltersApplied = response.filtersApplied;

        // update ui
        this.detectChanges();
      });
  }

  /**
   * Get Epi curve dashlet
   */
  private getEpiCurveDashlet(selector: string) {
    this.dialogV2Service.showSideDialog({
      // title
      title: {
        get: () => 'LNG_PAGE_DASHBOARD_EPI_CURVE_EXPORT_FORMAT'
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
              label: 'LNG_PAGE_DASHBOARD_EPI_CURVE_EXPORT_FORMAT_MULTI_PAGE',
              value: false
            },
            {
              label: 'LNG_PAGE_DASHBOARD_EPI_CURVE_EXPORT_FORMAT_SINGLE_PAGE',
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

      // export
      const loading = this.dialogV2Service.showLoadingDialog();
      this.domService
        .getPNGBase64(
          selector,
          '#tempCanvas',
          1
        )
        .subscribe((pngBase64) => {
          // object not found ?
          if (!pngBase64) {
            this.toastV2Service.notice('LNG_PAGE_DASHBOARD_EPI_ELEMENT_NOT_VISIBLE_ERROR_MSG');
            loading.close();
            return;
          }

          // export
          this.importExportDataService
            .exportImageToPdf({
              image: pngBase64,
              responseType: 'blob',
              splitFactor: 1,
              splitType: exportAsSinglePage ?
                'grid' :
                'auto'
            })
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                loading.close();
                return throwError(err);
              })
            )
            .subscribe((blob) => {
              this.downloadFile(blob, 'LNG_PAGE_DASHBOARD_EPI_CURVE_REPORT_LABEL');
              loading.close();
            });
        });

      // close popup
      response.handler.hide();
    });
  }

  /**
   * Download File
   */
  private downloadFile(
    blob,
    fileNameToken,
    extension: string = 'pdf'
  ) {
    const fileName = this.translateService.instant(fileNameToken);
    FileSaver.saveAs(
      blob,
      `${fileName}.${extension}`
    );
  }
}
