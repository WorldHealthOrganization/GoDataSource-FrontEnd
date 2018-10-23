import { Component, Input, OnChanges, OnInit, ViewEncapsulation } from '@angular/core';
import * as c3 from 'c3';

@Component({
    selector: 'app-c3-stacked-bar-chart',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './c3-stacked-bar-chart.component.html',
    styleUrls: ['./c3-stacked-bar-chart.component.less']
})
export class C3StackedBarChartComponent implements OnInit, OnChanges {

    @Input() chartData;
    @Input() chartDataColumns;
    @Input() chartDataCategories;
    chart: any;

    ngOnInit() {
        this.render();
    }

    public ngOnChanges(): any {
        // render c3 object
        this.render();
    }

    render() {
        console.log(this.chartData);
        this.chart = c3.generate({
            bindto: '#chart',
            zoom: {
                enabled: true
            },
            data: {
                columns:
                this.chartData,
                type: 'bar',
                groups: [
                    this.chartDataColumns
                ]
            },
            grid: {
                y: {
                    lines: [{value: 0}]
                }
            },
            bar: {
                width: {
                    ratio: 0.9 // this makes bar width 50% of length between ticks
                }
            },
            axis: {
                x: {
                    type: 'category',
                    categories: this.chartDataCategories,
                    tick: {
                        fit: true,
                        width: 100,
                        culling: false,
                        //     max: 5
                        // },
                        rotate: 70
                    }
                }
            },
            size: {
                height: 480
            },
            padding: {
                left: 20,
                right: 20
            }
        });
    }
}
