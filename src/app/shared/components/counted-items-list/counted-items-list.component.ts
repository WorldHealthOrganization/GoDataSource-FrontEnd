import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Constants } from '../../../core/models/constants';

export class CountedItemsListItem {
    /**
     * List item
     * @param {number} count
     * @param {string} label
     * @param {string} countBgColor
     */
    constructor(
        public count: number,
        public label: string,
        private _ids: string[],
        public countBgColor: string = Constants.DEFAULT_COLOR_REF_DATA
    ) {}

    public get ids(): string[] | boolean {
        return this._ids && this._ids.length > 0 ?
            this._ids :
            false;
    }
}

@Component({
    selector: 'app-counted-items-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './counted-items-list.component.html',
    styleUrls: ['./counted-items-list.component.less']
})
export class CountedItemsListComponent {
    @Input() items: CountedItemsListItem[] = [];

    @Output() optionChanged = new EventEmitter<any>();

    onChange(item) {
        this.optionChanged.emit(item);
    }
}
