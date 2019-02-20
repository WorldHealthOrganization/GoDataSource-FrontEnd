import { Component, Input, ViewEncapsulation } from '@angular/core';
import * as _ from 'lodash';
import { ChronologyItem } from './typings/chronology-item';

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
