import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import * as _ from 'lodash';
import { Router } from '@angular/router';
import { EntityType } from '../../../../core/models/entity-type';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { Subscription } from 'rxjs';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { TransmissionChainModel } from '../../../../core/models/transmission-chain.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { Constants } from '../../../../core/models/constants';

@Component({
  selector: 'app-histogram-transmission-chains-size-dashlet',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './histogram-transmission-chains-size-dashlet.component.html',
  styleUrls: ['./histogram-transmission-chains-size-dashlet.component.scss']
})
export class HistogramTransmissionChainsSizeDashletComponent implements OnInit, OnDestroy {
  histogramResults: any = [];
  caseRefDataColor: string = '';

  // detect changes
  @Output() detectChanges = new EventEmitter<void>();

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
  private _retrievedData: boolean;
  private _expanded: boolean = false;
  set expanded(expanded: boolean) {
    // set data
    this._expanded = expanded;

    // retrieve data if expanded and data not retrieved
    this.refreshData();
  }
  get expanded(): boolean {
    return this._expanded;
  }

  // outbreak
  outbreakId: string;

  // subscribers
  outbreakSubscriber: Subscription;
  previousSubscriber: Subscription;
  refdataSubscriber: Subscription;

  // loading data
  displayLoading: boolean = true;

  // authenticated user
  authUser: UserModel;

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
    private transmissionChainDataService: TransmissionChainDataService,
    private referenceDataDataService: ReferenceDataDataService,
    private outbreakDataService: OutbreakDataService,
    private router: Router,
    private authDataService: AuthDataService
  ) {}

  /**
     * Component initialized
     */
  ngOnInit() {
    // get the authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    // get case person type color
    this.refdataSubscriber = this.referenceDataDataService
      .getReferenceDataByCategory(ReferenceDataCategory.PERSON_TYPE)
      .subscribe((personTypes) => {
        const casePersonType = _.find(personTypes.entries, { value: EntityType.CASE });
        if (casePersonType) {
          this.caseRefDataColor = casePersonType.colorCode;
        }
      });

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
  }

  /**
     * set the data needed for the chart
     * @param chains
     */
  setHistogramResults(chains) {
    // determine size
    const chainsSize = {};
    this.histogramResults = [];
    _.forEach(chains, (value) => {
      if (!_.isEmpty(chainsSize) && chainsSize[value.size]) {
        chainsSize[value.size]++;
      } else {
        chainsSize[value.size] = 1;
      }
    });

    // push to chart
    _.forEach(chainsSize, (value, key) => {
      this.histogramResults.push({ name: key, value: value });
    });
  }

  /**
     * format the axis numbers to only display integers
     * @param data
     * @returns {string}
     */
  axisFormat(data) {
    if (data % 1 === 0) {
      return data.toLocaleString();
    } else {
      return '';
    }
  }

  /**
     * Handle click on a bar in the chart
     * Redirect to chains graph
     * @param event
     */
  onSelectChart(event) {
    // we need case list permission to redirect
    if (!TransmissionChainModel.canViewBubbleNetwork(this.authUser)) {
      return;
    }

    // extra params sent along with global filters
    const otherParams = {
      sizeOfChainsFilter: event.name,
      [Constants.DONT_LOAD_STATIC_FILTERS_KEY]: true
    };

    // construct global filter
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

    // do we need to include global filters ?
    if (_.isEmpty(global)) {
      this.router.navigate(['/transmission-chains'], { queryParams: otherParams });
    } else {
      this.router.navigate(['/transmission-chains'], {
        queryParams: {
          global: JSON.stringify(global),
          ...otherParams
        }
      });
    }
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

    // retrieve data
    if (this.outbreakId) {
      // release previous subscriber
      if (this.previousSubscriber) {
        this.previousSubscriber.unsubscribe();
        this.previousSubscriber = null;
      }

      // configure
      const qb = new RequestQueryBuilder();

      // change the way we build query
      qb.filter.firstLevelConditions();

      // date
      if (this.globalFilterDate) {
        qb.filter.byEquality(
          'endDate',
          moment(this.globalFilterDate).toISOString()
        );
      }

      // discarded cases
      // handled by API
      // NOTHING to do here

      // location
      if (this.globalFilterLocationId) {
        qb.addChildQueryBuilder('person').filter.where({
          or: [
            {
              type: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_EVENT',
              'address.parentLocationIdFilter': this.globalFilterLocationId
            }, {
              type: {
                inq: [
                  'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE',
                  'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CONTACT'
                ]
              },
              'addresses.parentLocationIdFilter': this.globalFilterLocationId
            }
          ]
        });
      }

      // classification
      if (!_.isEmpty(this.globalFilterClassificationId)) {
        // define classification conditions
        const classificationConditions = {
          or: [
            {
              type: {
                neq: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE'
              }
            }, {
              type: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE',
              classification: {
                inq: this.globalFilterClassificationId
              }
            }
          ]
        };

        // isolated classification
        qb.filter.where(classificationConditions);

        // person
        qb.addChildQueryBuilder('person').filter.where(classificationConditions);
      }

      // get chain data and convert to array of size and number
      this._retrievedData = true;
      this.displayLoading = true;
      this.detectChanges.emit();
      this.previousSubscriber = this.transmissionChainDataService
        .getCountIndependentTransmissionChains(
          this.outbreakId,
          qb
        )
        .subscribe((response) => {
          this.setHistogramResults(response.chains ? response.chains : []);
          this.displayLoading = false;
          this.detectChanges.emit();
        });
    }
  }
}
