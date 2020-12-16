import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-total-number-of-records',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './total-number-of-records.component.html',
    styleUrls: ['./total-number-of-records.component.less']
})
export class TotalNumberOfRecordsComponent {
    @Input() value: number;
}
