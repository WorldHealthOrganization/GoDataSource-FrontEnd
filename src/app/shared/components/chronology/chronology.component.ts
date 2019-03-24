import { Component, Input, ViewEncapsulation } from '@angular/core';
import * as _ from 'lodash';
import { ChronologyItem } from './typings/chronology-item';
import * as moment from 'moment';
import { Constants } from '../../../core/models/constants';

@Component({
    selector: 'app-chronology',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './chronology.component.html',
    styleUrls: ['./chronology.component.less']
})
export class ChronologyComponent {
    private _entries: ChronologyItem[] = [];

    Constants = Constants;

    @Input() set entries(entries: ChronologyItem[]) {
        // set collection
        this._entries = entries || [];

        // sort collection asc
        this._entries = _.sortBy(
            this._entries,
            'date'
        );

        // determine number of days between events
        let previousItem: ChronologyItem;
        this._entries.forEach((item: ChronologyItem, index: number) => {
            // we don't need to determine number of days for the first item
            if (index > 0) {
                item.daysSincePreviousEvent = moment(item.date).startOf('day').diff(moment(previousItem.date).startOf('day'), 'days');
            }

            // previous item
            previousItem = item;
        });
    }
    get entries(): ChronologyItem[] {
        return this._entries;
    }
}
