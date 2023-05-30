import { Component, Input, OnChanges, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import { bar, bb, FormatFunction, spline, zoom } from 'billboard.js';
import { Chart } from 'billboard.js/types/chart';

@Component({
  selector: 'app-bb-combination-stacked-bar-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './bb-combination-stacked-bar-chart.component.html',
  styleUrls: ['./bb-combination-stacked-bar-chart.component.scss']
})
export class BbCombinationStackedBarChartComponent implements OnInit, OnChanges, OnDestroy {

  @Input() chartData;
  @Input() chartDataColumns;
  @Input() chartDataCategories;
  @Input() showLabels: boolean | { format: FormatFunction } | { format: { [key: string]: FormatFunction } } = false;
  @Input() xLabel: string = '';
  @Input() yLabel: string = '';
  @Input() y2Label: string = '';
  @Input() colorPattern: string[] = [];
  @Input() lineData: any;
  @Input() chartId: string;
  @Input() y2Max: number;
  @Input() y2Min: number;
  @Input() initialZoomRanges: [number, number];
  @Input() tooltip: string;

  chart: Chart;

  maxTickCulling: number = 1;

  // timers
  private _zoomTimer: number;

  ngOnInit() {
    // render bb object
    this.render();
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  ngOnChanges(): any {
    // render bb object
    this.render();
  }

  private destroyChart() {
    // stop previous
    this.stopZoomTimer();

    // chart
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  /**
   * Zoom timer
   */
  private stopZoomTimer(): void {
    if (this._zoomTimer) {
      clearTimeout(this._zoomTimer);
      this._zoomTimer = undefined;
    }
  }

  /**
     * generate the chart
     */
  render() {
    // destroy before re-init
    this.destroyChart();

    const chartIdBind = '#' + this.chartId;
    this.chart = bb.generate({
      bindto: chartIdBind,
      oninit: () => {
        if (this.initialZoomRanges) {
          // stop previous
          this.stopZoomTimer();

          // call
          this._zoomTimer = setTimeout(() => {
            // reset
            this._zoomTimer = undefined;

            // zoom
            this.chart.zoom(this.initialZoomRanges);
          });
        }
      },
      onrendered: () => {
        // configure ticks
        this.configureNumberOfTicks(this.chartDataCategories.length);

        // reposition labels
        d3.selectAll('app-bb-combination-stacked-bar-chart .bb-chart-texts .bb-chart-text:nth-of-type(3) .bb-texts .bb-text').attr('y', '15px');
        d3.selectAll('app-bb-combination-stacked-bar-chart .bb-chart-texts .bb-chart-text:nth-of-type(1) .bb-texts .bb-text').attr('y', '31px');
        d3.selectAll('app-bb-combination-stacked-bar-chart .bb-chart-texts .bb-chart-text:nth-of-type(2) .bb-texts .bb-text').attr('y', '47px');
      },
      zoom: {
        enabled: zoom(),
        type: 'wheel',
        rescale: false,
        onzoom: (domain) => {
          // display the ticks based on the domain zoomed
          if (domain) {
            const domainDiff = domain[1] - domain[0];
            this.configureNumberOfTicks(domainDiff);
          }
        },
        extent: this.initialZoomRanges ? this.initialZoomRanges : undefined
      },
      interaction: {
        enabled: true
      },
      tooltip: {
        show: false
      },
      transition: {
        duration: 0
      },
      data: {
        columns: this.chartData,
        type: bar(),
        types: {
          [this.lineData]: spline()
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
          inner: false,
          label: {
            text: this.yLabel,
            position: 'outer-middle'
          },
          padding: {
            top: 0,
            bottom: 0
          }
        },
        y2: {
          show: true,
          inner: false,
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
          onclick: function() {
            return false;
          }
        }
      },
      padding: {
        left: 50,
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

    const elements: any = chartElement.querySelectorAll('.bb-axis-x');
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
      element.classList.add('bb-axis-x-n');
      element.classList.remove('bb-axis-x-2n');
      element.classList.remove('bb-axis-x-3n');
      element.classList.remove('bb-axis-x-5n');
      element.classList.remove('bb-axis-x-8n');
      element.classList.remove('bb-axis-x-10n');
    } else if (elementsDisplayedNo < 150 ) {
      element.classList.add('bb-axis-x-2n');
      element.classList.remove('bb-axis-x-n');
      element.classList.remove('bb-axis-x-3n');
      element.classList.remove('bb-axis-x-5n');
      element.classList.remove('bb-axis-x-8n');
      element.classList.remove('bb-axis-x-10n');
    } else if (elementsDisplayedNo < 250 ) {
      element.classList.add('bb-axis-x-3n');
      element.classList.remove('bb-axis-x-n');
      element.classList.remove('bb-axis-x-2n');
      element.classList.remove('bb-axis-x-5n');
      element.classList.remove('bb-axis-x-8n');
      element.classList.remove('bb-axis-x-10n');
    } else if (elementsDisplayedNo < 300 ) {
      element.classList.add('bb-axis-x-5n');
      element.classList.remove('bb-axis-x-n');
      element.classList.remove('bb-axis-x-2n');
      element.classList.remove('bb-axis-x-3n');
      element.classList.remove('bb-axis-x-8n');
      element.classList.remove('bb-axis-x-10n');
    } else if (elementsDisplayedNo < 350 ) {
      element.classList.add('bb-axis-x-8n');
      element.classList.remove('bb-axis-x-n');
      element.classList.remove('bb-axis-x-2n');
      element.classList.remove('bb-axis-x-3n');
      element.classList.remove('bb-axis-x-5n');
      element.classList.remove('bb-axis-x-10n');
    } else {
      element.classList.add('bb-axis-x-10n');
      element.classList.remove('bb-axis-x-n');
      element.classList.remove('bb-axis-x-2n');
      element.classList.remove('bb-axis-x-3n');
      element.classList.remove('bb-axis-x-5n');
      element.classList.remove('bb-axis-x-8n');
    }
  }
}
