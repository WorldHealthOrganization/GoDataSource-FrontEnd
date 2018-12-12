import { Component, Input, ViewEncapsulation } from '@angular/core';
import * as _ from 'lodash';

@Component({
    selector: 'app-number-of-items-label',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './number-of-items-label.component.html',
    styleUrls: ['./number-of-items-label.component.less']
})
export class NumberOfItemsLabelComponent {
    @Input() value: number;

    get translationData() {
        let numericValue = Number(this.value);
        numericValue = !_.isNaN(this.value) ? this.value : 0;

        return {
            value: numericValue
        };
    }
}
