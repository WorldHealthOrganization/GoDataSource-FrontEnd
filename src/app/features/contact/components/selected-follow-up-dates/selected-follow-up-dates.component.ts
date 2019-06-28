import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-selected-follow-up-dates',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './selected-follow-up-dates.component.html',
    styleUrls: ['./selected-follow-up-dates.component.less']
})
export class SelectedFollowUpDatesComponent {
    @Input() followUpDates: string[] = [];
}
