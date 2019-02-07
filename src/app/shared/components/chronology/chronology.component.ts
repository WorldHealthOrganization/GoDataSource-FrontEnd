import { Component, Input, ViewEncapsulation } from '@angular/core';
import * as _ from 'lodash';
import { Moment } from 'moment';

export class ChronologyItem {
    public label: string;
    public date: string | Moment;
    public translateData: {
        [key: string]: string
    } = {};

    constructor(data: {
        // required
        label: string,
        date: string | Moment,

        // optional
        translateData?: {
            [key: string]: string
        }
    }) {
        // assign properties
        Object.assign(
            this,
            data
        );
    }
}

@Component({
    selector: 'app-chronology',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './chronology.component.html',
    styleUrls: ['./chronology.component.less']
})
export class ChronologyComponent {
    private _entries: ChronologyItem[] = [];
    @Input() set entries(entries: ChronologyItem[]) {
        // set collection
        this._entries = entries;

        // sort collection asc
        this._entries = _.sortBy(
            this._entries,
            'date'
        );
    }
    get entries(): ChronologyItem[] {
        return this._entries;
    }
}
