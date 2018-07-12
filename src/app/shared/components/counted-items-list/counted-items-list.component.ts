import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';

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
        public countBgColor: string = '#CCC'
    ) {}
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
