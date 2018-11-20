import { EventEmitter, Input, Output } from '@angular/core';
import { Moment } from 'moment';
import { RequestQueryBuilder } from '../../../core/helperClasses/request-query-builder';
import { DebounceTimeCaller } from '../../../core/helperClasses/debounce-time-caller';
import { Subscriber } from 'rxjs/Subscriber';
import { ListFilterDataService } from '../../../core/services/data/list-filter.data.service';
import * as _ from 'lodash';

export abstract class DashletComponent {
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

    @Output() hide = new EventEmitter<void>();
    @Output() moveBefore = new EventEmitter<void>();
    @Output() moveAfter = new EventEmitter<void>();

    /**
     * Constructor
     * @param listFilterDataService
     */
    protected constructor(
        protected listFilterDataService: ListFilterDataService
    ) {}

    /**
     * Global Filters changed
     */
    protected refreshDataCaller = new DebounceTimeCaller(new Subscriber<void>(() => {
        this.refreshData();
    }), 100);

    onHide() {
        this.hide.emit();
    }

    onMoveBefore() {
        this.moveBefore.emit();
    }

    onMoveAfter() {
        this.moveAfter.emit();
    }

    /**
     * Global filters
     * @param dateFieldPath
     * @param locationFieldPath
     */
    getGlobalFilterQB(
        dateFieldPath: string | null,
        locationFieldPath: string | null
    ): RequestQueryBuilder {
        return this.listFilterDataService.getGlobalFilterQB(
            dateFieldPath,
            this.globalFilterDate,
            locationFieldPath,
            this.globalFilterLocationId
        );
    }

    /**
     * Generate dashlet params
     * @param otherParams
     */
    getDashletParamsIncludingGlobalFilters(
        otherParams: { [key: string]: any }
    ): { [key: string]: any } {
        // construct global filter
        const global: {
            date?: Moment,
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

        // do we need to include global filters ?
        if (_.isEmpty(global)) {
            return otherParams ? otherParams : {};
        }

        // finished
        return {
            global: JSON.stringify(global),
            ...otherParams
        };
    }

    /**
     * Refreshes dashlet data
     */
    abstract refreshData();
}
