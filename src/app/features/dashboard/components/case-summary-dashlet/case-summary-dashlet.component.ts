import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import * as _ from 'lodash';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { Subscriber, Subscription } from 'rxjs';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { Constants } from '../../../../core/models/constants';
import { Router } from '@angular/router';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { CaseModel } from '../../../../core/models/case.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { PieDonutChartData } from '../../../../shared/components/pie-donut-graph/pie-donut-chart.component';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';

@Component({
  selector: 'app-case-summary-dashlet',
  templateUrl: './case-summary-dashlet.component.html',
  styleUrls: ['./case-summary-dashlet.component.less']
})
export class CaseSummaryDashletComponent
implements OnInit, OnDestroy {
  // data
  data: PieDonutChartData[] = [];

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

  // detect changes
  @Output() detectChanges = new EventEmitter<void>();

  // outbreak
  outbreakId: string;

  // subscribers
  outbreakSubscriber: Subscription;
  caseClassificationSubscriber: Subscription;
  previousSubscriber: Subscription;

  // loading data
  displayLoading: boolean = true;

  // authenticated user
  authUser: UserModel;

  /**
     * Global Filters changed
     */
  protected refreshDataCaller = new DebounceTimeCaller(new Subscriber<void>(() => {
    this.refreshData();
  }), 100);

  /**
     * Constructor
     */
  constructor(
    private outbreakDataService: OutbreakDataService,
    private referenceDataDataService: ReferenceDataDataService,
    private caseDataService: CaseDataService,
    private router: Router,
    private authDataService: AuthDataService
  ) {}

  /**
     * Component initialized
     */
  ngOnInit() {
    // get the authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    // outbreak
    this.displayLoading = true;
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        if (selectedOutbreak) {
          this.outbreakId = selectedOutbreak.id;
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

    // case classification subscriber
    if (this.caseClassificationSubscriber) {
      this.caseClassificationSubscriber.unsubscribe();
      this.caseClassificationSubscriber = null;
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
     * Redirect to cases page when user click on a piece of pie chart to display the cases that represent the part of pie chart
     */
  onDoughnutPress(item: PieDonutChartData): void {
    // we need case list permission to redirect
    if (!CaseModel.canList(this.authUser)) {
      return;
    }

    // construct redirect global filter
    const global: {
      date?: Moment | string,
      locationId?: string
    } = {};

    // do we have a global date set ?
    if (!_.isEmpty(this.globalFilterDate)) {
      global.date = this.globalFilterDate;
    }

    // do we have a global location Id set ?
    if (!_.isEmpty(this.globalFilterLocationId)) {
      global.locationId = this.globalFilterLocationId;
    }

    // redirect
    this.router.navigate(['cases'],
      {
        queryParams: {
          global: JSON.stringify(global),
          applyListFilter: Constants.APPLY_LIST_FILTER.CASE_SUMMARY,
          [Constants.DONT_LOAD_STATIC_FILTERS_KEY]: true,
          x: item.key
        }
      });
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

      // construct query builder
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

      // ignore not a case records
      qb.filter.where({
        classification: {
          neq: Constants.CASE_CLASSIFICATION.NOT_A_CASE
        }
      });

      // classification
      if (!_.isEmpty(this.globalFilterClassificationId)) {
        qb.filter.bySelect(
          'classification',
          this.globalFilterClassificationId,
          false,
          null
        );
      }

      // retrieve data
      this.displayLoading = true;
      this.detectChanges.emit();
      this.previousSubscriber = this.caseDataService
        .getCasesGroupedByClassification(this.outbreakId, qb)
        .subscribe((groupedCases) => {
          // format data
          this.data = [];
          if (
            groupedCases &&
            groupedCases.classification
          ) {
            _.each(
              groupedCases.classification,
              (
                classificationData: {
                  count: number
                },
                classificationKey: string
              ) => {
                this.data.push(new PieDonutChartData({
                  key: classificationKey,
                  color: null,
                  label: classificationKey,
                  value: classificationData.count
                }));
              }
            );
          }

          // nothing else to do ?
          if (this.data.length < 1) {
            // finished
            this.displayLoading = false;
            this.detectChanges.emit();
            return;
          }

          // case classification subscriber
          if (this.caseClassificationSubscriber) {
            this.caseClassificationSubscriber.unsubscribe();
            this.caseClassificationSubscriber = null;
          }

          // retrieve color
          this.caseClassificationSubscriber = this.referenceDataDataService
            .getReferenceDataByCategory(ReferenceDataCategory.CASE_CLASSIFICATION)
            .subscribe((caseClassifications) => {
              // go through data and map color
              const classificationColorMap: {
                [classificationKey: string]: string
              } = {};
              caseClassifications.entries.forEach((entry) => {
                classificationColorMap[entry.value] = entry.colorCode;
              });

              // put colors into data elements
              this.data.forEach((dataItem) => {
                dataItem.color = classificationColorMap[dataItem.key] ?
                  classificationColorMap[dataItem.key] :
                  Constants.DEFAULT_COLOR_REF_DATA;
              });

              // finished
              this.displayLoading = false;
              this.detectChanges.emit();
            });
        });
    }
  }
}
