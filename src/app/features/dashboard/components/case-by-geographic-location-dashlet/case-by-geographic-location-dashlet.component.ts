import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import * as _ from 'lodash';
import { Subscription ,  Subscriber } from 'rxjs';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { Router } from '@angular/router';
import { Constants } from '../../../../core/models/constants';
import { Moment } from '../../../../core/helperClasses/x-moment';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { PieDonutChartData } from '../../../../shared/components/pie-donut-graph/pie-donut-chart.component';
import { CaseModel } from '../../../../core/models/case.model';

@Component({
    selector: 'app-case-by-geographic-location-dashlet',
    templateUrl: './case-by-geographic-location-dashlet.component.html',
    styleUrls: ['./case-by-geographic-location-dashlet.component.less']
})
export class CasesByGeographicLocationDashletComponent
    implements OnInit, OnDestroy {

    // data
    data: PieDonutChartData[] = [];

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

    // subscribers
    outbreakSubscriber: Subscription;
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
            date?: Moment,
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
        this.router.navigate([`cases`],
            {
                queryParams: {
                    global: JSON.stringify(global),
                    applyListFilter: Constants.APPLY_LIST_FILTER.CASES_BY_LOCATION,
                    [Constants.DONT_LOAD_STATIC_FILTERS_KEY]: true,
                    locationId: item.key
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

            // retrieve data
            this.displayLoading = true;
            this.previousSubscriber = this.caseDataService
                .getCasesPerLocation(this.outbreakId, qb)
                .subscribe((locationsMetric) => {
                    // format data
                    this.data = [];
                    (locationsMetric.locations || []).forEach((locationMetric) => {
                        // no need to handle this one ?
                        if (locationMetric.casesCount < 1) {
                            return;
                        }

                        // create data item
                        this.data.push(new PieDonutChartData({
                            key: locationMetric.location.id,
                            color: null,
                            label: locationMetric.location.name,
                            value: locationMetric.casesCount
                        }));
                    });

                    // assign colors
                    PieDonutChartData.assignColorDomain(this.data);

                    // finished
                    this.displayLoading = false;
                });
        }
    }
}
