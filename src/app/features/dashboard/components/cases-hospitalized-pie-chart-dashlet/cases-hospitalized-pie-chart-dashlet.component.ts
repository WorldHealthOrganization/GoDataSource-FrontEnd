import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { Subscription, throwError, Observable } from 'rxjs';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { catchError, map } from 'rxjs/operators';
import { Constants } from '../../../../core/models/constants';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { CaseModel } from '../../../../core/models/case.model';
import { PieDonutChartComponent, PieDonutChartData } from '../../../../shared/components/pie-donut-graph/pie-donut-chart.component';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataCategory, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { LocalizationHelper, Moment } from '../../../../core/helperClasses/localization-helper';

@Component({
  selector: 'app-cases-hospitalized-pie-chart-dashlet',
  templateUrl: './cases-hospitalized-pie-chart-dashlet.component.html'
})
export class CasesHospitalizedPieChartDashletComponent
implements OnInit, OnDestroy {
  // kpi dashlet
  @ViewChild(PieDonutChartComponent, { static: false }) dashlet: PieDonutChartComponent;

  // data
  getData$: Observable<PieDonutChartData[]>;

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
  private _selectedOutbreak: OutbreakModel;

  // subscribers
  private _outbreakSubscriber: Subscription;

  // authenticated user
  private _authUser: UserModel;

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
    private outbreakDataService: OutbreakDataService,
    private caseDataService: CaseDataService,
    protected toastV2Service: ToastV2Service,
    private router: Router,
    private authDataService: AuthDataService,
    private activatedRoute: ActivatedRoute
  ) {}

  /**
     * Component initialized
     */
  ngOnInit() {
    // get the authenticated user
    this._authUser = this.authDataService.getAuthenticatedUser();

    // outbreak
    this._outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        if (selectedOutbreak) {
          this._selectedOutbreak = selectedOutbreak;
          this.refreshDataCaller.call();
        }
      });
  }

  /**
     * Component destroyed
     */
  ngOnDestroy() {
    // outbreak subscriber
    if (this._outbreakSubscriber) {
      this._outbreakSubscriber.unsubscribe();
      this._outbreakSubscriber = null;
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
  onDoughnutPress(item: PieDonutChartData) {
    // we need case list permission to redirect
    if (!CaseModel.canList(this._authUser)) {
      return;
    }

    // construct redirect global filter
    const global: {
      date?: Moment | string,
      locationId?: string,
      classificationId?: string[]
    } = {};

    // do we have a global date set ?
    if (!_.isEmpty(this.globalFilterDate)) {
      global.date = this.globalFilterDate;
    }

    // do we have a global location Id set ?
    if (!_.isEmpty(this.globalFilterLocationId)) {
      global.locationId = this.globalFilterLocationId;
    }

    // do we have a global classification Ids set ?
    if (!_.isEmpty(this.globalFilterClassificationId)) {
      global.classificationId = this.globalFilterClassificationId;
    }

    // redirect
    this.router.navigate(['cases'],
      {
        queryParams: {
          global: JSON.stringify(global),
          applyListFilter: Constants.APPLY_LIST_FILTER.CASES_DATE_RANGE_SUMMARY,
          x: item.key,
          [Constants.DONT_LOAD_STATIC_FILTERS_KEY]: true
        }
      });
  }

  /**
     * Refresh Data
     */
  refreshData() {
    if (!this._selectedOutbreak?.id) {
      return;
    }

    // construct query builder
    const qb = new RequestQueryBuilder();

    // date
    if (this.globalFilterDate) {
      qb.filter.byDateRange(
        'dateOfReporting', {
          endDate: LocalizationHelper.toMoment(this.globalFilterDate).endOf('day').format()
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

    // exclude discarded cases
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

    // determine hospitalized & isolated for a specific date
    qb.flag(
      'date',
      this.globalFilterDate
    );

    // make the request to count hospitalized, isolated ...
    this.getData$ = this.caseDataService
      .getCasesHospitalized(
        this._selectedOutbreak.id,
        qb
      )
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        })
      )
      .pipe(map((response) => {
        // don't display total
        delete response.total;

        // create data
        const allVisible: boolean = !this._selectedOutbreak.allowedRefDataItems ||
          !this._selectedOutbreak.allowedRefDataItems[ReferenceDataCategory.LNG_REFERENCE_DATA_CATEGORY_PERSON_DATE_TYPE] ||
          Object.keys(this._selectedOutbreak.allowedRefDataItems[ReferenceDataCategory.LNG_REFERENCE_DATA_CATEGORY_PERSON_DATE_TYPE]).length < 1;
        const data: PieDonutChartData[] = Object.keys(response)
          .filter((key) => {
            return allVisible ||
              this._selectedOutbreak.allowedRefDataItems[ReferenceDataCategory.LNG_REFERENCE_DATA_CATEGORY_PERSON_DATE_TYPE][key];
          })
          .map((key) => new PieDonutChartData({
            key,
            color: (this.activatedRoute.snapshot.data.dateRangeType as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[key] ?
              (this.activatedRoute.snapshot.data.dateRangeType as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[key].getColorCode() :
              null,
            label: key,
            value: response[key]
          }));

        // finished
        return data;
      }));

    // update ui
    this.detectChanges.emit();
  }
}
