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
    @Input() showLabels: boolean = false;
    // @Input() maxTickCulling: number = 1;
    @Input() xLabel: string = '';
    @Input() yLabel: string = '';
    @Input() colorPattern: string[] = [];
    chart: any;

    maxTickCulling: number = 1;
    allowZoom = true;

    ngOnInit() {
        // render c3 object
        this.render();
    }

    ngOnChanges(): any {
        // render c3 object
        this.render();
    }

    /**
     * generate the chart
     */
    render(domainSet = null) {
        console.log('render');
        this.chart = c3.generate({
            onrendered: () => {
                if (domainSet) {
                    this.allowZoom = true;
                   console.log('zoom on domain');
                   console.log(domainSet);
                   this.chart.zoom(domainSet);
                }
            },
            bindto: '#chart',
            zoom: {
                enabled: true,
                rescale: true,
                onzoom: (domain) => {
                    console.log('on zoom');

                    if (domain && this.allowZoom) {

                        const domainDiff = domain[1] - domain[0];
                        const initialMaxTickCulling = this.maxTickCulling;
                        console.log(domainDiff);

                        if (domainDiff < 20) {
                            this.maxTickCulling = 1;
                        } else if (domainDiff < 80 ) {
                            this.maxTickCulling = 2;
                        } else if (domainDiff < 200 ) {
                            this.maxTickCulling = 3;
                        } else {
                            this.maxTickCulling = 7;
                        }

                        if (initialMaxTickCulling !== this.maxTickCulling) {
                            this.allowZoom = false;
                            console.log('update culling');

                          this.chart = this.chart.destroy();
 //                          this.chart.flush();
                           this.render(domain);
                           // this.chart.zoom(domain);

                        }
                    }



                    console.log(this.maxTickCulling);
                    console.log(domain);
                }
            },
            interaction: {
                enabled: false
            },
            tooltip: {
                show: true
            },
            transition: {
                duration: 0
            },
            data: {
                columns: this.chartData,
                type: 'bar',
                groups: [
                    this.chartDataColumns
                ],
                labels: this.showLabels
            },
            bar: {
                width: {
                    ratio: 0.9
                }
            },
            axis: {
                x: {
                    label: {
                        text: this.xLabel,
                        position: 'outer-right'
                    },
                    type: 'category',
                    categories: this.chartDataCategories,
                    tick: {
                        width: 100,
                        culling: {
                            max: this.maxTickCulling
                        },
                        rotate: 70
                    }
                },
                y: {
                    inner: true,
                    label: {
                        text: this.yLabel,
                        position: 'outer-middle'
                    },
                    tick: {
                        format: function (d) {
                            return d % 1 === 0 ? String(d) : '';
                        }
                    }
                }
            },
            legend: {
                item: {
                    // disable click on legend
                    onclick: function (id) {
                        return false;
                    }
                }
            },
            padding: {
                left: 20,
                right: 20
            },
            color: {
                pattern: this.colorPattern
            }
        });

        console.log("zoom on domain end ");
        console.log(domainSet);
   //     this.chart.zoom(domainSet);

    }
}
