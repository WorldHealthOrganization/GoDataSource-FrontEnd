import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-dashboard-custom-metric-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './dashboard-custom-metric-dashlet.component.html',
    styleUrls: ['./dashboard-custom-metric-dashlet.component.less']
})
export class DashboardCustomMetricDashletComponent {
    // value to display in the box
    @Input() value: number;

    // link & link params
    @Input() link: string | string[];
    @Input() params: any;
}


