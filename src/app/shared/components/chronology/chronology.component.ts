import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-chronology',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './chronology.component.html',
    styleUrls: ['./chronology.component.less']
})
export class ChronologyComponent {

    @Input() entries: any[] = [];

}
