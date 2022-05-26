import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
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

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnDestroy {
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
  private _outbreakSubscriber: Subscription;
  private _selectedOutbreak: OutbreakModel;

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

    // subscribe to outbreak changes
    this._outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        if (selectedOutbreak?.id) {
          this._selectedOutbreak = selectedOutbreak;
        }
      });

    // initialize quick actions
    this.initializeQuickActions();
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // outbreak
    if (this._outbreakSubscriber) {
      this._outbreakSubscriber.unsubscribe();
      this._outbreakSubscriber = undefined;
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
      visible: () => !!this._selectedOutbreak?.id && (
        DashboardModel.canExportCaseClassificationPerLocationReport(this._authUser) ||
        DashboardModel.canExportContactFollowUpSuccessRateReport(this._authUser) ||
        DashboardModel.canViewEpiCurveStratifiedByClassificationDashlet(this._authUser) ||
        DashboardModel.canViewEpiCurveStratifiedByOutcomeDashlet(this._authUser) ||
        DashboardModel.canViewEpiCurveStratifiedByClassificationOverReportTimeDashlet(this._authUser)
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
          action: {
            click: () => {
              this.getEpiCurveDashlet('app-epi-curve-reporting-dashlet svg');
            }
          },
          visible: () => DashboardModel.canViewEpiCurveStratifiedByClassificationOverReportTimeDashlet(this._authUser)
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
    const loading = this.dialogV2Service.showLoadingDialog();
    this.domService
      .getPNGBase64(selector, '#tempCanvas')
      .subscribe((pngBase64) => {
        // object not found ?
        if (!pngBase64) {
          this.toastV2Service.notice('LNG_PAGE_DASHBOARD_EPI_ELEMENT_NOT_VISIBLE_ERROR_MSG');
          loading.close();
          return;
        }

        // export
        this.importExportDataService
          .exportImageToPdf({ image: pngBase64, responseType: 'blob', splitFactor: 1 })
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

  // // provide constants to template
  // DashboardDashlet = DashboardDashlet;
  // DashboardModel = DashboardModel;
  //
  // selectedOutbreak: OutbreakModel;
  //
  // // flag if there aren't any outbreaks in the system
  // noOutbreaksInSystem: boolean = false;
  //
  // // constants
  // ExportDataExtension = ExportDataExtension;
  //
  // casesByClassificationAndLocationReportUrl: string = '';
  // contactsFollowupSuccessRateReportUrl: string = '';
  //
  // loadingDialog: LoadingDialogModel;
  //
  // // available side filters
  // availableSideFilters: FilterModel[] = [];
  //
  // globalFilterDate: Moment = moment();
  // globalFilterLocationId: string;
  // globalFilterClassificationId: string[] = [];
  //
  // @ViewChild('kpiSection') private kpiSection: ElementRef;
  // @ViewChildren('kpiSectionGroup') private kpiSectionGroup: QueryList<MatExpansionPanel>;
  //
  // // subscribers
  // outbreakSubscriber: Subscription;
  //
  // Constants = Constants;
  //
  // epiCurveViewType;
  // epiCurveViewTypes$: Observable<any[]>;
  //
  // caseClassificationsList$: Observable<LabelValuePair[]>;
  //
  // /**
  //    * Constructor
  //    */
  // constructor(
  //   private authDataService: AuthDataService,
  //   private outbreakDataService: OutbreakDataService,
  //   private domService: DomService,
  //   private importExportDataService: ImportExportDataService,
  //   private i18nService: I18nService,
  //   private genericDataService: GenericDataService,
  //   private dialogService: DialogService,
  //   protected toastV2Service: ToastV2Service,
  //   private systemSettingsDataService: SystemSettingsDataService,
  //   private referenceDataDataService: ReferenceDataDataService
  // ) {
  //   // get the authenticated user
  //   this.authUser = this.authDataService.getAuthenticatedUser();
  // }
  //
  // /**
  //    * Component initialized
  //    */
  // ngOnInit() {
  //   // map kpi groups
  //   this.kpiGroupsMap = {};
  //   this.kpiGroups.forEach((group) => {
  //     this.kpiGroupsMap[group.id] = group;
  //   });
  //
  //   this.caseClassificationsList$ = this.referenceDataDataService
  //     .getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION)
  //     .pipe(
  //       map((records: LabelValuePair[]) => {
  //         return _.filter(
  //           records,
  //           (record: LabelValuePair) => {
  //             return record.value !== Constants.CASE_CLASSIFICATION.NOT_A_CASE;
  //           }
  //         );
  //       }),
  //       share()
  //     );
  //
  //   this.initializeDashlets();
  //
  //   // get Outbreaks list to check if there are any in the system
  //   this.outbreakDataService
  //     .getOutbreaksCount()
  //     .subscribe((outbreaksCount) => {
  //       this.noOutbreaksInSystem = !outbreaksCount.count;
  //     });
  //
  //   this.outbreakSubscriber = this.outbreakDataService
  //     .getSelectedOutbreakSubject()
  //     .subscribe((selectedOutbreak: OutbreakModel) => {
  //       if (selectedOutbreak && selectedOutbreak.id) {
  //         this.selectedOutbreak = selectedOutbreak;
  //         this.casesByClassificationAndLocationReportUrl = `/outbreaks/${this.selectedOutbreak.id}/cases/per-classification-per-location-level-report/download/`;
  //         this.contactsFollowupSuccessRateReportUrl = `/outbreaks/${this.selectedOutbreak.id}/contacts/per-location-level-tracing-report/download/`;
  //       }
  //     });
  //
  //   // set default epi curve
  //   if (DashboardModel.canViewEpiCurveStratifiedByClassificationDashlet(this.authUser)) {
  //     this.epiCurveViewType = Constants.EPI_CURVE_TYPES.CLASSIFICATION.value;
  //   } else if (DashboardModel.canViewEpiCurveStratifiedByOutcomeDashlet(this.authUser)) {
  //     this.epiCurveViewType = Constants.EPI_CURVE_TYPES.OUTCOME.value;
  //   } else if (DashboardModel.canViewEpiCurveStratifiedByClassificationOverReportTimeDashlet(this.authUser)) {
  //     this.epiCurveViewType = Constants.EPI_CURVE_TYPES.REPORTING.value;
  //   } else {
  //     // NOT SUPPORTED
  //   }
  //
  //   // initialize Side Filters
  //   this.initializeSideFilters();
  // }
  //
  // /**
  //    * Component destroyed
  //    */
  // ngOnDestroy() {
  //   // outbreak subscriber
  //   if (this.outbreakSubscriber) {
  //     this.outbreakSubscriber.unsubscribe();
  //     this.outbreakSubscriber = null;
  //   }
  // }
  //
  // /**
  //    * Initialize Side Filters
  //    */
  // private initializeSideFilters() {
  //   // set available side filters
  //   this.availableSideFilters = [
  //     new FilterModel({
  //       fieldName: 'locationId',
  //       fieldLabel: 'LNG_GLOBAL_FILTERS_FIELD_LABEL_LOCATION',
  //       type: FilterType.LOCATION,
  //       required: true,
  //       multipleOptions: false,
  //       value: this.globalFilterLocationId
  //     }),
  //     new FilterModel({
  //       fieldName: 'date',
  //       fieldLabel: 'LNG_GLOBAL_FILTERS_FIELD_LABEL_DATE',
  //       type: FilterType.DATE,
  //       required: true,
  //       maxDate: moment(),
  //       value: this.globalFilterDate
  //     }),
  //     new FilterModel({
  //       fieldName: 'classificationId',
  //       fieldLabel: 'LNG_GLOBAL_FILTERS_FIELD_LABEL_CLASSIFICATION',
  //       type: FilterType.MULTISELECT,
  //       required: true,
  //       options$: this.caseClassificationsList$,
  //       value: this.globalFilterClassificationId
  //     })
  //   ];
  // }
  //
  // private initializeDashlets() {
  //   const userDashboardSettings: UserSettingsDashboardModel = this.authUser.getSettings(UserSettings.DASHBOARD);
  //   _.each(this.kpiGroups, (group) => {
  //     _.each(group.dashlets, (dashlet) => {
  //       // add the dashlet to the list (if it's not already existing)
  //       userDashboardSettings.addDashletIfNotExists(new DashletSettingsModel({
  //         name: dashlet,
  //         kpiGroup: group.id
  //       }));
  //     });
  //   });
  //
  //   // Update dashlets order based on authenticated user's settings
  //   this.refreshDashletsOrder();
  // }
  //
  // /**
  //    * Update dashlets order based on authenticated user's settings
  //    */
  // private refreshDashletsOrder() {
  //   const dashboardSettings = this.authUser.getSettings(UserSettings.DASHBOARD);
  //   _.each(this.kpiGroups, (group) => {
  //     group.dashlets.sort((a, b) => {
  //       const dashletA = dashboardSettings.getDashlet(a);
  //       const dashletB = dashboardSettings.getDashlet(b);
  //
  //       if (dashletA && dashletB) {
  //         return dashletA.order - dashletB.order;
  //       } else {
  //         return 1;
  //       }
  //     });
  //   });
  // }
  //
  // /**
  //    * Persist user's settings for the dashboard
  //    */
  // private persistUserDashboardSettings(): Observable<any> {
  //   return this.authDataService.updateSettingsForCurrentUser({
  //     [UserSettings.DASHBOARD]: this.authUser.getSettings(UserSettings.DASHBOARD)
  //   });
  // }
  //
  // /**
  //    * Check if a dashlet is visible for current user
  //    * @param name
  //    */
  // isDashletVisible(name: string): boolean {
  //   return _.get(
  //     this.authUser.getSettings(UserSettings.DASHBOARD).getDashlet(name),
  //     'visible',
  //     true
  //   );
  // }
  //
  // /**
  //    * Hide a dashlet for current user
  //    * @param name
  //    */
  // hideDashlet(name: string) {
  //   this.authUser.getSettings(UserSettings.DASHBOARD).hideDashlet(name);
  //
  //   this.refreshDashletsOrder();
  //
  //   // persist changes
  //   this.persistUserDashboardSettings().subscribe();
  // }
  //
  // moveDashletBefore(name: string) {
  //   this.authUser.getSettings(UserSettings.DASHBOARD).moveDashletBefore(name);
  //
  //   this.refreshDashletsOrder();
  //
  //   // persist changes
  //   this.persistUserDashboardSettings().subscribe();
  // }
  //
  // moveDashletAfter(name: string) {
  //   this.authUser.getSettings(UserSettings.DASHBOARD).moveDashletAfter(name);
  //
  //   this.refreshDashletsOrder();
  //
  //   // persist changes
  //   this.persistUserDashboardSettings().subscribe();
  // }
  //
  // showAllDashlets(kpiGroup: string) {
  //   this.authUser.getSettings(UserSettings.DASHBOARD).showAllDashlets(kpiGroup);
  //   // persist changes
  //   this.persistUserDashboardSettings().subscribe();
  // }
  //
  //
  // /**
  //    * Generate KPIs report
  //    */
  // generateKpisReport() {
  //   // display error message if we try to render empty item
  //   let atLeastOneIsExpanded: boolean = false;
  //   this.kpiSectionGroup.forEach((item) => {
  //     if (item.expanded) {
  //       atLeastOneIsExpanded = true;
  //     }
  //   });
  //   if (!atLeastOneIsExpanded) {
  //     this.toastV2Service.error('LNG_PAGE_DASHBOARD_KPIS_ELEMENTS_NOT_VISIBLE_ERROR_MSG');
  //     return;
  //   }
  //
  //   // display loading
  //   this.showLoadingDialog();
  //
  //   // convert dom container to image
  //   setTimeout(() => {
  //     (domtoimage as any).toPng(this.kpiSection.nativeElement)
  //       .then((dataUrl) => {
  //         const dataBase64 = dataUrl.replace('data:image/png;base64,', '');
  //
  //         this.importExportDataService
  //           .exportImageToPdf({ image: dataBase64, responseType: 'blob', splitFactor: 1 })
  //           .pipe(
  //             catchError((err) => {
  //               this.toastV2Service.error(err);
  //               this.closeLoadingDialog();
  //               return throwError(err);
  //             })
  //           )
  //           .subscribe((blob) => {
  //             this.downloadFile(blob, 'LNG_PAGE_DASHBOARD_KPIS_REPORT_LABEL');
  //           });
  //       });
  //   });
  // }
  //
  //
  // /**
  //    * Apply side filters
  //    * @param data
  //    */
  // applySideFilters(filters: AppliedFilterModel[]) {
  //   // retrieve date & location filters
  //   // retrieve location filter
  //   const dateFilter: AppliedFilterModel = _.find(filters, { filter: { fieldName: 'date' } });
  //   const locationFilter: AppliedFilterModel = _.find(filters, { filter: { fieldName: 'locationId' } });
  //   const classificationFilter: AppliedFilterModel = _.find(filters, { filter: { fieldName: 'classificationId' } });
  //
  //   // set filters
  //   this.globalFilterDate = _.isEmpty(dateFilter.value) ? undefined : moment(dateFilter.value);
  //   this.globalFilterLocationId = _.isEmpty(locationFilter.value) ? undefined : locationFilter.value;
  //   this.globalFilterClassificationId = _.isEmpty(classificationFilter.value) ? undefined : classificationFilter.value;
  // }
  //
  // /**
  //    * Display loading dialog
  //    */
  // showLoadingDialog() {
  //   this.loadingDialog = this.dialogService.showLoadingDialog();
  // }
  //
  // /**
  //    * Hide loading dialog
  //    */
  // closeLoadingDialog() {
  //   if (this.loadingDialog) {
  //     this.loadingDialog.close();
  //     this.loadingDialog = null;
  //   }
  // }
  //
  //
  //
  // /**
  //    * Check if we have kpi group access
  //    */
  // hasKpiAccess(): boolean {
  //   // check if there is at least one group that has access
  //   for (const group of this.kpiGroups) {
  //     if (group.hasAccess(this.authUser)) {
  //       return true;
  //     }
  //   }
  //
  //   // we don't have access
  //   return false;
  // }
}
