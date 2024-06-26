import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Constants } from '../../../../core/models/constants';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { MetricContactsFollowedUpReportModel } from '../../../../core/models/metrics/metric-contacts-followed-up-report.model';
import { FormatFunction } from 'billboard.js';
import { LocalizationHelper, Moment } from '../../../../core/helperClasses/localization-helper';

@Component({
  selector: 'app-contact-follow-up-overview-dashlet',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './contact-follow-up-overview-dashlet.component.html',
  styleUrls: ['./contact-follow-up-overview-dashlet.component.scss']
})
export class ContactFollowUpOverviewDashletComponent implements OnInit, OnDestroy {
  // detect changes
  @Output() detectChanges = new EventEmitter<void>();

  chartData: any = [];
  chartDataCategories: any = [];
  chartDataColumns: any = [];
  lineData: any = '';
  viewType = Constants.EPI_CURVE_VIEW_TYPE.MONTH.value;
  colorPattern: string[] = [];

  showLabels: { format: { [prop: string]: FormatFunction } };

  // constants
  Constants = Constants;

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

  // outbreak
  outbreakId: string;
  outbreak: OutbreakModel;

  dashletZoomRanges: [number, number];

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
    private contactDataService: ContactDataService,
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
  setContactFollowUpReportResults(metricData: MetricContactsFollowedUpReportModel[]) {
    // if we don't have contact follow-ups to display return
    if (metricData.length === 0) {
      return;
    }

    // initialize data
    this.colorPattern = [];
    this.chartDataCategories = [];
    this.chartDataColumns = [];
    const chartData = {};

    const followedUpTranslated = this.i18nService.instant('LNG_PAGE_DASHBOARD_CONTACT_FOLLOW_UP_REPORT_FOLLOWED_UP_LABEL');
    const notFollowedUpTranslated = this.i18nService.instant('LNG_PAGE_DASHBOARD_CONTACT_FOLLOW_UP_REPORT_NOT_FOLLOWED_UP_LABEL');
    const percentageTranslated = this.i18nService.instant('LNG_PAGE_DASHBOARD_CONTACT_FOLLOW_UP_REPORT_NOT_PERCENTAGE_LABEL');

    // set label renderer
    this.showLabels = {
      format: {
        [followedUpTranslated]: (v: number): string => {
          return v.toString();
        },
        [notFollowedUpTranslated]: (v: number): string => {
          return v.toString();
        },
        [percentageTranslated]: (v: number): string => {
          return v.toString() + ' %';
        }
      }
    };

    // build chart data
    (metricData || []).forEach((metric) => {
      // create the array with categories ( dates displayed on x axis )
      this.chartDataCategories.push(LocalizationHelper.displayDate(metric.day));

      if (chartData[followedUpTranslated]) {
        chartData[followedUpTranslated].push(metric.followedUp);
      } else {
        this.chartDataColumns.push(followedUpTranslated);
        this.colorPattern.push(Constants.DEFAULT_COLOR_CHART_CONTACTS_FOLLOWED);

        chartData[followedUpTranslated] = [];
        chartData[followedUpTranslated].push(followedUpTranslated);
        chartData[followedUpTranslated].push(metric.followedUp);
      }

      if (chartData[notFollowedUpTranslated]) {
        chartData[notFollowedUpTranslated].push(metric.notFollowedUp);
      } else {
        this.chartDataColumns.push(notFollowedUpTranslated);
        this.colorPattern.push(Constants.DEFAULT_COLOR_CHART_CONTACTS_NOT_FOLLOWED);

        chartData[notFollowedUpTranslated] = [];
        chartData[notFollowedUpTranslated].push(notFollowedUpTranslated);
        chartData[notFollowedUpTranslated].push(metric.notFollowedUp);
      }

      if (chartData[percentageTranslated]) {
        chartData[percentageTranslated].push(Math.round(metric.percentage));
      } else {
        // this.chartDataColumns.push('percentage');
        this.colorPattern.push(Constants.DEFAULT_COLOR_CHART_CONTACTS_PERCENTAGE);

        chartData[percentageTranslated] = [];
        chartData[percentageTranslated].push(percentageTranslated);
        chartData[percentageTranslated].push(Math.round(metric.percentage));
      }

    });

    // construct the milestones
    const maxMilestone = chartData[followedUpTranslated].length;
    const firstMilestone = maxMilestone - this.outbreak.periodOfFollowup;

    // setup zoom ranges based on milestones
    this.dashletZoomRanges = [firstMilestone, maxMilestone];

    this.lineData = percentageTranslated;
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
      if (this.globalFilterDate) {
        qb.filter.byEquality(
          'endDate',
          LocalizationHelper.toMoment(this.globalFilterDate).clone().endOf('day').toISOString()
        );
      } else {
        qb.filter.byEquality(
          'endDate',
          LocalizationHelper.now().endOf('day').toISOString()
        );
      }

      // location - follow-up address
      if (this.globalFilterLocationId) {
        qb.filter.byEquality(
          'address.parentLocationIdFilter',
          this.globalFilterLocationId
        );
      }

      // classification
      // !!! must be on first level and not under $and
      if (!_.isEmpty(this.globalFilterClassificationId)) {
        qb.filter.bySelect(
          'classification',
          this.globalFilterClassificationId,
          false,
          null
        );
      }

      // get data - start Date will be set to start of outbreak
      this._retrievedData = true;
      this.displayLoading = true;
      this.detectChanges.emit();
      this.previousSubscriber = this.contactDataService
        .getContactsFollowedUpReport(this.outbreakId, qb)
        .subscribe((results) => {
          // convert data to chart data format
          this.chartData = [];
          const chartDataObject = this.setContactFollowUpReportResults(results);
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
