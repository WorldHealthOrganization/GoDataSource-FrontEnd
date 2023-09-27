import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Constants } from '../../../../core/models/constants';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { MetricCasesBasedOnContactStatusModel } from '../../../../core/models/metrics/metric-cases-based-on-contact-status.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { LocalizationHelper, Moment } from '../../../../core/helperClasses/localization-helper';

@Component({
  selector: 'app-cases-based-on-contact-status-dashlet',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './cases-based-on-contact-status-dashlet.component.html',
  styleUrls: ['./cases-based-on-contact-status-dashlet.component.scss']
})
export class CasesBasedOnContactStatusDashletComponent implements OnInit, OnDestroy {
  // detect changes
  @Output() detectChanges = new EventEmitter<void>();

  chartData: any = [];
  chartDataCategories: any = [];
  chartDataColumns: any = [];
  lineData: any = '';
  colorPattern: string[] = [];

  // constants
  Constants = Constants;

  // Global filters => Date
  private _globalFilterDate: Moment | string;
  @Input() set globalFilterDate(globalFilterDate: Moment | string) {
    this._globalFilterDate = globalFilterDate;
    this.refreshDataCaller.call();
  }
  get globalFilterDate(): Moment | string {
    return this._globalFilterDate;
  }

  // Global Filters => Location
  private _globalFilterLocationId: string;
  @Input() set globalFilterLocationId(globalFilterLocationId: string) {
    this._globalFilterLocationId = globalFilterLocationId;
    this.refreshDataCaller.call();
  }
  get globalFilterLocationId(): string {
    return this._globalFilterLocationId;
  }

  // Global Filters => Case Classification
  private _globalFilterClassificationId: string[];
  @Input() set globalFilterClassificationId(globalFilterClassificationId: string[]) {
    this._globalFilterClassificationId = globalFilterClassificationId;
    this.refreshDataCaller.call();
  }
  get globalFilterClassificationId(): string[] {
    return this._globalFilterClassificationId;
  }

  // expanded / collapsed ?
  expandedOnce: boolean = false;
  private _retrievedData: boolean;
  private _expanded: boolean = false;
  set expanded(expanded: boolean) {
    // set data
    this._expanded = expanded;

    // set expanded once
    if (this._expanded) {
      this.expandedOnce = true;
    }

    // retrieve data if expanded and data not retrieved
    this.refreshData();
  }
  get expanded(): boolean {
    return this._expanded;
  }

  // outbreak
  outbreakId: string;
  outbreak: OutbreakModel;

  // subscribers
  outbreakSubscriber: Subscription;
  previousSubscriber: Subscription;

  // loading data
  displayLoading: boolean = true;

  /**
     * Global Filters changed
     */
  protected refreshDataCaller = new DebounceTimeCaller(() => {
    this._retrievedData = false;
    this.refreshData();
  }, 100);

  /**
     * Constructor
     */
  constructor(
    private caseDataService: CaseDataService,
    private outbreakDataService: OutbreakDataService,
    private i18nService: I18nService
  ) {}

  /**
     * Component initialized
     */
  ngOnInit() {
    // retrieve ref data
    this.displayLoading = true;
    // outbreak
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        if (selectedOutbreak) {
          this.outbreakId = selectedOutbreak.id;
          this.outbreak = selectedOutbreak;
          this.refreshDataCaller.call();
        }
      });
  }

  /**
   * Component destroyed
   */
  ngOnDestroy() {
    // outbreak subscriber
    if (this.outbreakSubscriber) {
      this.outbreakSubscriber.unsubscribe();
      this.outbreakSubscriber = null;
    }

    // release previous subscriber
    if (this.previousSubscriber) {
      this.previousSubscriber.unsubscribe();
      this.previousSubscriber = null;
    }

    // debounce caller
    if (this.refreshDataCaller) {
      this.refreshDataCaller.unsubscribe();
      this.refreshDataCaller = null;
    }
  }

  /**
     * set the data needed for the chart
     */
  setCasesBasedOnContactStatusReportResults(metricData: MetricCasesBasedOnContactStatusModel[]) {
    // initialize data
    this.colorPattern = [];
    this.chartDataCategories = [];
    this.chartDataColumns = [];
    const chartData = {};

    const totalCasesNotFromContactTranslated = this.i18nService.instant('LNG_PAGE_DASHBOARD_CASES_CONTACT_STATUS_REPORT_NOT_FROM_CONTACT_LABEL');
    const totalCasesFromContactWithFollowupCompleteTranslated = this.i18nService.instant('LNG_PAGE_DASHBOARD_CASES_CONTACT_STATUS_REPORT_FROM_CONTACT_WITH_FOLLOW_UP_COMPLETE_LABEL');
    const totalCasesFromContactWithFollowupLostToFollowupTranslated = this.i18nService.instant('LNG_PAGE_DASHBOARD_CASES_CONTACT_STATUS_REPORT_FROM_CONTACT_WITH_FOLLOW_UP_LOST_LABEL');
    const percentageOfCasesWithFollowupDataTranslated = this.i18nService.instant('LNG_PAGE_DASHBOARD_CASES_CONTACT_STATUS_REPORT_PERCENTAGE_LABEL');

    // build chart data
    _.forEach(metricData, (metric) => {
      // create the array with categories ( dates displayed on x axis )
      this.chartDataCategories.push(LocalizationHelper.toMoment(metric.start).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT));

      if (chartData[totalCasesNotFromContactTranslated]) {
        chartData[totalCasesNotFromContactTranslated].push(metric.totalCasesNotFromContact);
      } else {
        this.chartDataColumns.push(totalCasesNotFromContactTranslated);
        this.colorPattern.push(Constants.DEFAULT_COLOR_CHART_CASE_NOT_FROM_CONTACT);

        chartData[totalCasesNotFromContactTranslated] = [];
        chartData[totalCasesNotFromContactTranslated].push(totalCasesNotFromContactTranslated);
        chartData[totalCasesNotFromContactTranslated].push(metric.totalCasesNotFromContact);
      }

      if (chartData[totalCasesFromContactWithFollowupCompleteTranslated]) {
        chartData[totalCasesFromContactWithFollowupCompleteTranslated].push(metric.totalCasesFromContactWithFollowupComplete);
      } else {
        this.chartDataColumns.push(totalCasesFromContactWithFollowupCompleteTranslated);
        this.colorPattern.push(Constants.DEFAULT_COLOR_CHART_CASE_FROM_CONTACT_FOLLOW_UP_COMPLETE);

        chartData[totalCasesFromContactWithFollowupCompleteTranslated] = [];
        chartData[totalCasesFromContactWithFollowupCompleteTranslated].push(totalCasesFromContactWithFollowupCompleteTranslated);
        chartData[totalCasesFromContactWithFollowupCompleteTranslated].push(metric.totalCasesFromContactWithFollowupComplete);
      }

      if (chartData[totalCasesFromContactWithFollowupLostToFollowupTranslated]) {
        chartData[totalCasesFromContactWithFollowupLostToFollowupTranslated].push(metric.totalCasesFromContactWithFollowupLostToFollowup);
      } else {
        this.chartDataColumns.push(totalCasesFromContactWithFollowupLostToFollowupTranslated);
        this.colorPattern.push(Constants.DEFAULT_COLOR_CHART_CASE_FROM_CONTACT_LOST_TO_FOLLOW_UP);

        chartData[totalCasesFromContactWithFollowupLostToFollowupTranslated] = [];
        chartData[totalCasesFromContactWithFollowupLostToFollowupTranslated].push(totalCasesFromContactWithFollowupLostToFollowupTranslated);
        chartData[totalCasesFromContactWithFollowupLostToFollowupTranslated].push(metric.totalCasesFromContactWithFollowupLostToFollowup);
      }

      if (chartData[percentageOfCasesWithFollowupDataTranslated]) {
        chartData[percentageOfCasesWithFollowupDataTranslated].push(metric.percentageOfCasesWithFollowupData);
      } else {
        this.colorPattern.push(Constants.DEFAULT_COLOR_CHART_CASE_FROM_CONTACT_PERCENTAGE);

        chartData[percentageOfCasesWithFollowupDataTranslated] = [];
        chartData[percentageOfCasesWithFollowupDataTranslated].push(percentageOfCasesWithFollowupDataTranslated);
        chartData[percentageOfCasesWithFollowupDataTranslated].push(metric.percentageOfCasesWithFollowupData);
      }

    });

    this.lineData = percentageOfCasesWithFollowupDataTranslated;
    // finish
    return chartData;
  }

  /**
     * Refresh Data
     */
  refreshData() {
    // not expanded ?
    if (
      !this.expanded ||
      this._retrievedData
    ) {
      return;
    }

    if (this.outbreakId) {
      // release previous subscriber
      if (this.previousSubscriber) {
        this.previousSubscriber.unsubscribe();
        this.previousSubscriber = null;
      }

      // add global filters
      const qb = new RequestQueryBuilder();

      // change the way we build query
      qb.filter.firstLevelConditions();

      // date
      let endDate: string = LocalizationHelper.now().endOf('day').toISOString();
      if (this.globalFilterDate) {
        endDate = LocalizationHelper.toMoment(this.globalFilterDate).clone().endOf('day').toISOString();
      }

      // location
      if (this.globalFilterLocationId) {
        qb.filter.byEquality(
          'addresses.parentLocationIdFilter',
          this.globalFilterLocationId
        );
      }

      // set period type to day to show the whole period
      qb.filter.byEquality(
        'periodType',
        'day'
      );

      // set period interval until current date
      qb.filter.where({
        periodInterval: [null, endDate]
      });

      // exclude discarded cases
      qb.filter.where({
        classification: {
          neq: Constants.CASE_CLASSIFICATION.NOT_A_CASE
        }
      });

      // classification
      if (!_.isEmpty(this.globalFilterClassificationId)) {
        qb.filter.where({
          and: [{
            classification: {
              inq: this.globalFilterClassificationId
            }
          }]
        });
      }

      // get data - start Date will be set to start of outbreak
      this._retrievedData = true;
      this.displayLoading = true;
      this.detectChanges.emit();
      this.previousSubscriber = this.caseDataService
        .getCasesBasedOnContactStatusReport(this.outbreakId, qb)
        .subscribe((results) => {
          // convert data to chart data format
          this.chartData = [];
          const chartDataObject = this.setCasesBasedOnContactStatusReportResults(results);
          _.each(chartDataObject, (data) => {
            this.chartData.push(data);
          });

          // finished
          this.displayLoading = false;
          this.detectChanges.emit();
        });
    }
  }
}
