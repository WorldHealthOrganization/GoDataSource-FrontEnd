import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-dashboard-metric-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './dashboard-metric-dashlet.component.html',
    styleUrls: ['./dashboard-metric-dashlet.component.less']
})
export class DashboardMetricDashletComponent {
    // title
    @Input() metricTitle: string | string[];
    // link
    @Input() link: string | string[];
    // link
    @Input() queryParams: any;
    // value to display in the box
    @Input() value: number;

}


