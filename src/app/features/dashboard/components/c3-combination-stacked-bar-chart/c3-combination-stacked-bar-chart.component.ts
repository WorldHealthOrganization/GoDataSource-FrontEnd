import { Component, Input, OnChanges, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import * as c3 from 'c3';

@Component({
    selector: 'app-c3-combination-stacked-bar-chart',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './c3-combination-stacked-bar-chart.component.html',
    styleUrls: ['./c3-combination-stacked-bar-chart.component.less']
})
export class C3CombinationStackedBarChartComponent implements OnInit, OnChanges, OnDestroy {

    @Input() chartData;
    @Input() chartDataColumns;
    @Input() chartDataCategories;
    @Input() showLabels: boolean = false;
    @Input() xLabel: string = '';
    @Input() yLabel: string = '';
    @Input() y2Label: string = '';
    @Input() colorPattern: string[] = [];
    @Input() lineData: any;
    @Input() chartId: string;
    @Input() y2Max: number;
    @Input() y2Min: number;

    chart: any;

    maxTickCulling: number = 1;

    ngOnInit() {
        // render c3 object
        this.render();
    }

    ngOnDestroy(): void {
        this.destroyChart();
    }

    ngOnChanges(): any {
        // render c3 object
        this.render();
    }

    private destroyChart() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    /**
     * generate the chart
     */
    render() {
        // destroy before re-init
        this.destroyChart();

        const chartIdBind = '#' + this.chartId;
        this.chart = c3.generate({
            bindto: chartIdBind,
            onrendered: () => {
                this.configureNumberOfTicks(this.chartDataCategories.length);
            },
            zoom: {
                enabled: true,
                rescale: false,
                onzoom: (domain) => {
                    // display the ticks based on the domain zoomed
                    if (domain) {
                        const domainDiff = domain[1] - domain[0];
                        this.configureNumberOfTicks(domainDiff);
                    }
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
                types: {
                    [this.lineData]: 'spline',
                },
                groups: [
                    this.chartDataColumns
                ],
                labels: this.showLabels,
                axes: {
                    [this.lineData]: 'y2'
                }
            },
            point: {
                show: false
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
                },
                y2: {
                    show: true,
                    inner: true,
                    label: {
                        text: this.y2Label,
                        position: 'outer-middle'
                    },
                    max: this.y2Max,
                    min: this.y2Min,
                    padding: {
                        top: 0,
                        bottom: 0
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
                left: 25,
                right: 25
            },
            color: {
                pattern: this.colorPattern
            }
        });

    }

    /**
     * configure the number of ticks to be displayed
     * @param {number} elementsDisplayedNo
     */
    configureNumberOfTicks(elementsDisplayedNo: number) {
        const chartElement = document.getElementById(this.chartId);
        if (!chartElement) {
            return;
        }

        const elements: any = chartElement.querySelectorAll('.c3-axis-x');
        if (
            !elements ||
            elements.length < 1
        ) {
            return;
        }

        const element: any = elements[0];
        if (
            !element ||
            !element.classList
        ) {
            return;
        }

        if (elementsDisplayedNo < 70) {
            element.classList.add('c3-axis-x-n');
            element.classList.remove('c3-axis-x-2n');
            element.classList.remove('c3-axis-x-3n');
            element.classList.remove('c3-axis-x-5n');
            element.classList.remove('c3-axis-x-8n');
            element.classList.remove('c3-axis-x-10n');
        } else if (elementsDisplayedNo < 150 ) {
            element.classList.add('c3-axis-x-2n');
            element.classList.remove('c3-axis-x-n');
            element.classList.remove('c3-axis-x-3n');
            element.classList.remove('c3-axis-x-5n');
            element.classList.remove('c3-axis-x-8n');
            element.classList.remove('c3-axis-x-10n');
        } else if (elementsDisplayedNo < 250 ) {
            element.classList.add('c3-axis-x-3n');
            element.classList.remove('c3-axis-x-n');
            element.classList.remove('c3-axis-x-2n');
            element.classList.remove('c3-axis-x-5n');
            element.classList.remove('c3-axis-x-8n');
            element.classList.remove('c3-axis-x-10n');
        } else if (elementsDisplayedNo < 300 ) {
            element.classList.add('c3-axis-x-5n');
            element.classList.remove('c3-axis-x-n');
            element.classList.remove('c3-axis-x-2n');
            element.classList.remove('c3-axis-x-3n');
            element.classList.remove('c3-axis-x-8n');
            element.classList.remove('c3-axis-x-10n');
        } else if (elementsDisplayedNo < 350 ) {
            element.classList.add('c3-axis-x-8n');
            element.classList.remove('c3-axis-x-n');
            element.classList.remove('c3-axis-x-2n');
            element.classList.remove('c3-axis-x-3n');
            element.classList.remove('c3-axis-x-5n');
            element.classList.remove('c3-axis-x-10n');
        } else {
            element.classList.add('c3-axis-x-10n');
            element.classList.remove('c3-axis-x-n');
            element.classList.remove('c3-axis-x-2n');
            element.classList.remove('c3-axis-x-3n');
            element.classList.remove('c3-axis-x-5n');
            element.classList.remove('c3-axis-x-8n');
        }
    }
}
