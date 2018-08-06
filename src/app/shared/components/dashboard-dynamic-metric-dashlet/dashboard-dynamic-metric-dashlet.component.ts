import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-dashboard-dynamic-metric-dashlet',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './dashboard-dynamic-metric-dashlet.component.html',
    styleUrls: ['./dashboard-dynamic-metric-dashlet.component.less']
})
export class DashboardDynamicMetricDashletComponent {
    // title
    @Input() metricTitle: string | string[];
    // link
    @Input() link: string | string[];
    // link
    @Input() queryParams: any;
    // value to display in the box
    @Input() value: number;
    // setting value
    @Input() settingValue: number;
    // value change emitter
    @Output() settingChanged = new EventEmitter<any>();


    /**
     * Emit setting value changed
     */
    onChangeSetting() {
        this.settingChanged.emit(this.settingValue);
    }

}


