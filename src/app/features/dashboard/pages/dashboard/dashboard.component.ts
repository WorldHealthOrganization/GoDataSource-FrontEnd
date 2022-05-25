import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { IV2ActionMenuLabel } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { V2AdvancedFilterComparatorOptions, V2AdvancedFilterComparatorType, V2AdvancedFilterType } from '../../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { ActivatedRoute } from '@angular/router';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { Constants } from '../../../../core/models/constants';
import { SavedFilterData, SavedFilterDataAppliedFilter } from '../../../../core/models/saved-filters.model';
import * as _ from 'lodash';
import { Moment, moment } from '../../../../core/helperClasses/x-moment';
import { RequestFilterOperator } from '../../../../core/helperClasses/request-query-builder';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [{
    label: 'LNG_PAGE_DASHBOARD_TITLE',
    action: null
  }];

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

  // visible dashlets
  visibleDashlets: {
    KPICases: boolean,
    KPIContacts: boolean,
    KPICOT: boolean
  } = {
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
    authDataService: AuthDataService
  ) {
    // authenticated user
    const authUser = authDataService.getAuthenticatedUser();

    // determine visible dashlets
    this.visibleDashlets = {
      // KPI - cases
      KPICases: DashboardModel.canViewCaseDeceasedDashlet(authUser) ||
        DashboardModel.canViewCaseHospitalizedDashlet(authUser) ||
        DashboardModel.canViewCaseWithLessThanXCotactsDashlet(authUser) ||
        DashboardModel.canViewNewCasesInPreviousXDaysAmongKnownContactsDashlet(authUser) ||
        DashboardModel.canViewCasesRefusingTreatmentDashlet(authUser) ||
        DashboardModel.canViewNewCasesFromKnownCOTDashlet(authUser) ||
        DashboardModel.canViewCasesWithPendingLabResultsDashlet(authUser) ||
        DashboardModel.canViewCasesNotIdentifiedThroughContactsDashlet(authUser),

      // KPI - contacts
      KPIContacts: DashboardModel.canViewContactsPerCaseMeanDashlet(authUser) ||
        DashboardModel.canViewContactsPerCaseMedianDashlet(authUser) ||
        DashboardModel.canViewContactsFromFollowUpsDashlet(authUser) ||
        DashboardModel.canViewContactsLostToFollowUpsDashlet(authUser) ||
        DashboardModel.canViewContactsNotSeenInXDaysDashlet(authUser) ||
        DashboardModel.canViewContactsBecomeCasesDashlet(authUser) ||
        DashboardModel.canViewContactsSeenDashlet(authUser) ||
        DashboardModel.canViewContactsWithSuccessfulFollowUpsDashlet(authUser),

      // KPI - COT
      KPICOT: DashboardModel.canViewIndependentCOTDashlet(authUser) ||
        DashboardModel.canViewContactsNotSeenInXDaysDashlet(authUser) ||
        DashboardModel.canViewContactsBecomeCasesDashlet(authUser)
    };
  }

  /**
   * Refresh template
   */
  detectChanges(): void {
    this.changeDetectorRef.detectChanges();
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
  //   // load epi curves types
  //   this.epiCurveViewTypes$ = this.genericDataService
  //     .getEpiCurvesTypes()
  //     .pipe(map((data: LabelValuePair[]) => {
  //       // keep only those types to which we have access
  //       return data.filter((item: LabelValuePair): boolean => {
  //         switch (item.value) {
  //           case Constants.EPI_CURVE_TYPES.CLASSIFICATION.value:
  //             return DashboardModel.canViewEpiCurveStratifiedByClassificationDashlet(this.authUser);
  //           case Constants.EPI_CURVE_TYPES.OUTCOME.value:
  //             return DashboardModel.canViewEpiCurveStratifiedByOutcomeDashlet(this.authUser);
  //           case Constants.EPI_CURVE_TYPES.REPORTING.value:
  //             return DashboardModel.canViewEpiCurveStratifiedByClassificationOverReportTimeDashlet(this.authUser);
  //           default:
  //             // NOT SUPPORTED
  //             return false;
  //         }
  //       });
  //     }));
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
  // /**
  //    * generate EPI curve report - image will be exported as pdf
  //    */
  // generateEpiCurveReport() {
  //   this.showLoadingDialog();
  //   switch (this.epiCurveViewType) {
  //     case Constants.EPI_CURVE_TYPES.CLASSIFICATION.value:
  //       this.getEpiCurveDashlet('app-epi-curve-dashlet svg');
  //       break;
  //     case Constants.EPI_CURVE_TYPES.OUTCOME.value:
  //       this.getEpiCurveDashlet('app-epi-curve-outcome-dashlet svg');
  //       break;
  //     case Constants.EPI_CURVE_TYPES.REPORTING.value:
  //       this.getEpiCurveDashlet('app-epi-curve-reporting-dashlet svg');
  //       break;
  //   }
  // }
  //
  // /**
  //    * Get Epi curve dashlet
  //    */
  // private getEpiCurveDashlet(selector: string) {
  //   this.domService
  //     .getPNGBase64(selector, '#tempCanvas')
  //     .subscribe((pngBase64) => {
  //       // object not found ?
  //       if (!pngBase64) {
  //         this.toastV2Service.error('LNG_PAGE_DASHBOARD_EPI_ELEMENT_NOT_VISIBLE_ERROR_MSG');
  //         this.closeLoadingDialog();
  //         return;
  //       }
  //
  //       // export
  //       this.importExportDataService
  //         .exportImageToPdf({ image: pngBase64, responseType: 'blob', splitFactor: 1 })
  //         .pipe(
  //           catchError((err) => {
  //             this.toastV2Service.error(err);
  //             this.closeLoadingDialog();
  //             return throwError(err);
  //           })
  //         )
  //         .subscribe((blob) => {
  //           this.downloadFile(blob, 'LNG_PAGE_DASHBOARD_EPI_CURVE_REPORT_LABEL');
  //         });
  //     });
  // }
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
  // /**
  //    * Download File
  //    * @param blob
  //    * @param fileNameToken
  //    */
  // private downloadFile(
  //   blob,
  //   fileNameToken,
  //   extension: string = 'pdf'
  // ) {
  //   const fileName = this.i18nService.instant(fileNameToken);
  //   FileSaver.saveAs(
  //     blob,
  //     `${fileName}.${extension}`
  //   );
  //   this.closeLoadingDialog();
  // }
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
  // /**
  //    * Cases by classification and location qb
  //    */
  // qbCaseByClassification(): RequestQueryBuilder {
  //   // initialization
  //   const qb = new RequestQueryBuilder();
  //
  //   // date
  //   if (this.globalFilterDate) {
  //     qb.filter.byDateRange(
  //       'dateOfReporting', {
  //         endDate: this.globalFilterDate.endOf('day').format()
  //       }
  //     );
  //   }
  //
  //   // location
  //   if (this.globalFilterLocationId) {
  //     qb.filter.byEquality(
  //       'addresses.parentLocationIdFilter',
  //       this.globalFilterLocationId
  //     );
  //   }
  //
  //   // classification
  //   // since we display all classifications in the exported file, it would be strange to filter them by classification
  //   // so there is nothing to filter here
  //   // if (this.globalFilterClassificationId) {
  //   //     qb.filter.bySelect(
  //   //         'classification',
  //   //         this.globalFilterClassificationId,
  //   //         false,
  //   //         null
  //   //     );
  //   // }
  //
  //   // finished
  //   return qb;
  // }
  //
  // /**
  //    * Contacts follow up success rate
  //    */
  // qbContactsFollowUpSuccessRate(): RequestQueryBuilder {
  //   // initialization
  //   const qb = new RequestQueryBuilder();
  //
  //   // date filters
  //   if (this.globalFilterDate) {
  //     // pdf report
  //     qb.filter.flag(
  //       'dateOfFollowUp',
  //       this.globalFilterDate.startOf('day').format()
  //     );
  //
  //     // same as list view
  //     qb.filter.byDateRange(
  //       'dateOfReporting', {
  //         endDate: this.globalFilterDate.endOf('day').format()
  //       }
  //     );
  //   }
  //
  //   // location
  //   if (this.globalFilterLocationId) {
  //     qb.filter.byEquality(
  //       'addresses.parentLocationIdFilter',
  //       this.globalFilterLocationId
  //     );
  //   }
  //
  //   // classification
  //   // there is no need to filter by classification since this api filters contacts and not cases...
  //   // if (this.globalFilterClassificationId) {
  //   //     qb.filter.bySelect(
  //   //         'classification',
  //   //         this.globalFilterClassificationId,
  //   //         false,
  //   //         null
  //   //     );
  //   // }
  //
  //   // finished
  //   return qb;
  // }
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
