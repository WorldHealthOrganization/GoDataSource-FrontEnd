import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { Constants } from '../../../../core/models/constants';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { SVGGantt } from 'gantt';
import { MetricCasesDelayBetweenOnsetLabTestModel } from '../../../../core/models/metrics/metric-cases-delay-between-onset-lab-test.model';
import { EntityType } from '../../../../core/models/entity-type';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { v4 as uuid } from 'uuid';
import { IGanttDataInterface } from '../../interfaces/gantt-data.interface';
import { Moment } from '../../../../core/helperClasses/localization-helper';

@Component({
  selector: 'app-gantt-chart-delay-onset-dashlet',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './gantt-chart-delay-onset-dashlet.component.html',
  styleUrls: ['./gantt-chart-delay-onset-dashlet.component.scss']
})
export class GanttChartDelayOnsetDashletComponent implements OnInit, OnDestroy {
  // delay needed to display entries who doesn't have a delay between dates
  static DELAY_MISSING_ED_ADD_TIME: number = 10 * 60 * 60 * 1000;

  // constants
  Constants = Constants;

  // gantt chart settings
  ganttChart: any;
  ganttData: IGanttDataInterface[] = [];
  options = {
    // View mode: day/week/month
    viewMode: Constants.GANTT_CHART_VIEW_TYPE.DAY.value,
    styleOptions: {
      groupBack: '#4DB0A0',
      redLineColor: 'transparent'
    }
  };

  // subscribers
  outbreakSubscriber: Subscription;
  previousSubscriber: Subscription;
  refdataSubscriber: Subscription;

  // Global filters => Date
  private _globalFilterDate: Moment;
  @Input() set globalFilterDate(globalFilterDate: Moment) {
    this._globalFilterDate = globalFilterDate;
    this.refreshDataCaller.call();
  }
  get globalFilterDate(): Moment {
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

  // outbreak
  outbreakId: string;

  // loading data
  displayLoading: boolean = true;

  // timers
  private _displayChartTimer: number;

  /**
     * Global Filters changed
     */
  protected refreshDataCaller = new DebounceTimeCaller(() => {
    this.refreshData();
  }, 100);

  /**
     * Constructor
     */
  constructor(
    private caseDataService: CaseDataService,
    private referenceDataDataService: ReferenceDataDataService,
    private outbreakDataService: OutbreakDataService
  ) {}

  /**
     * Component initialized
     */
  ngOnInit() {
    // retrieve ref data
    this.displayLoading = true;
    this.refdataSubscriber = this.referenceDataDataService
      .getReferenceDataByCategory(ReferenceDataCategory.LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE)
      .subscribe((personTypes) => {
        const casePersonType = _.find(personTypes.entries, { value: EntityType.CASE });
        if (casePersonType) {
          // set case color
          if (casePersonType.colorCode) {
            this.options.styleOptions.groupBack = casePersonType.colorCode;
          }

          // outbreak subscriber
          if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
          }

          // outbreak
          this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
              if (selectedOutbreak) {
                this.outbreakId = selectedOutbreak.id;
                this.refreshDataCaller.call();
              }
            });
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

    // ref data
    if (this.refdataSubscriber) {
      this.refdataSubscriber.unsubscribe();
      this.refdataSubscriber = null;
    }

    // debounce caller
    if (this.refreshDataCaller) {
      this.refreshDataCaller.unsubscribe();
      this.refreshDataCaller = null;
    }

    // stop timers
    this.stopDisplayChartTimer();
  }

  /**
     * display the gantt chart
     */
  displayChart() {
    // remove existing element then create the new one
    const elem = document.getElementById('gantt-svg-root');
    if (elem) {
      elem.innerHTML = '';
    }

    // only display id data is available
    if (this.ganttData.length > 0) {
      this.ganttChart = new SVGGantt(
        '#gantt-svg-root',
        this.ganttData,
        this.options
      );
    }
  }

  /**
     * format the data in the desired format
     */
  formatData(metricResults: MetricCasesDelayBetweenOnsetLabTestModel[]) {
    // initialize
    const casesAlreadyRendered: {
      [id: string]: true
    } = {};
    this.ganttData = [];

    // add data
    _.forEach(metricResults, (result) => {
      if (
        !_.isEmpty(result.dateOfOnset) &&
                !_.isEmpty(result.dateSampleTaken)
      ) {
        // create gantt render item
        const chartDataItemChild: IGanttDataInterface = {
          id: casesAlreadyRendered[result.case.id] ?
            uuid() :
            result.case.id,
          type: 'group',
          text: result.case.name,
          start: new Date(Date.parse(result.dateOfOnset)),
          end: null,
          links: casesAlreadyRendered[result.case.id] ?
            [{
              target: result.case.id,
              type: 'SF'
            }] :
            undefined
        };

        // check if we have any result with no delay and increase the time on the dateOfOnset and set it as
        // dateSampleTaken for labResult to be displayed on the chart
        // increasing time to the dateOfOnset to set it as dateSampleTaken
        chartDataItemChild.end = result.delay > 0 ?
          new Date(Date.parse(result.dateSampleTaken)) :
          new Date(new Date(result.dateOfOnset).getTime() + GanttChartDelayOnsetDashletComponent.DELAY_MISSING_ED_ADD_TIME);

        // remember that we rendered this case already
        casesAlreadyRendered[result.case.id] = true;

        // finished - add to list items to render
        this.ganttData.push(chartDataItemChild);
      }
    });
  }

  /**
     * trigger change view: days, months, weeks
     * @param viewType
     */
  changeView(viewType) {
    // configure new settings
    this.options.viewMode = viewType;

    // re-render chart
    this.displayChart();
  }

  /**
   * Stop timer
   */
  private stopDisplayChartTimer(): void {
    if (this._displayChartTimer) {
      clearTimeout(this._displayChartTimer);
      this._displayChartTimer = undefined;
    }
  }

  /**
     * Refresh Data
     */
  refreshData() {
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
        qb.filter.byDateRange(
          'dateOfOnset', {
            endDate: this.globalFilterDate.endOf('day').format()
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

      // load data and display chart
      this.displayLoading = true;
      this.previousSubscriber = this.caseDataService
        .getDelayBetweenOnsetAndLabTesting(this.outbreakId, qb)
        .subscribe((results) => {
          // configure data
          this.formatData(results);

          // stop previous
          this.stopDisplayChartTimer();

          // bind properties => show container
          this.displayLoading = false;
          this._displayChartTimer = setTimeout(() => {
            // reset
            this._displayChartTimer = undefined;

            // display
            this.displayChart();
          });
        });
    }
  }

  /**
     * Check if graph has data
     */
  hasData(): boolean {
    return this.ganttData.length > 0;
  }
}
