import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { bar, bb, zoom } from 'billboard.js';
import { Chart } from 'billboard.js/types/chart';

@Component({
  selector: 'app-bb-stacked-bar-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './bb-stacked-bar-chart.component.html',
  styleUrls: ['./bb-stacked-bar-chart.component.less']
})
export class BbStackedBarChartComponent implements OnInit, OnChanges, OnDestroy {
  // chart id generator
  chartId: string = `chart${uuid()}`;

  @Input() chartData;
  @Input() chartDataColumns;
  @Input() chartDataCategories;
  @Input() showLabels: boolean = false;
  @Input() showLegend: boolean = true;
  @Input() zoomEnabled: boolean = true;
  @Input() xLabel: string = '';
  @Input() yLabel: string = '';
  @Input() colorPattern: string[] = [];
  chart: Chart;

  maxTickCulling: number = 1;

  timeoutCall: any;

  ngOnInit() {
    // render bb object
    this.ngOnChanges();
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  ngOnChanges(): any {
    // stop previous
    if (this.timeoutCall) {
      clearTimeout(this.timeoutCall);
      this.timeoutCall = undefined;
    }

    // render bb object
    this.timeoutCall = setTimeout(() => {
      this.timeoutCall = undefined;
      this.render();
    });
  }

  private destroyChart() {
    // stop render
    if (this.timeoutCall) {
      clearTimeout(this.timeoutCall);
      this.timeoutCall = undefined;
    }

    // destroy chart
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  /**
   * Constructor
   */
  constructor(
    private elementRef: ElementRef
  ) {}

  /**
     * generate the chart
     */
  render() {
    // destroy before re-init
    this.destroyChart();

    // create chart
    this.chart = bb.generate({
      bindto: `#${this.chartId}`,
      onrendered: () => {
        this.configureNumberOfTicks(this.chartDataCategories.length);
      },
      zoom: {
        enabled: this.zoomEnabled ?
          zoom() :
          false,
        type: 'wheel',
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
          inner: false,
          label: {
            text: this.yLabel,
            position: 'outer-middle'
          },
          tick: {
            format: function(d) {
              return d % 1 === 0 ? String(d) : '';
            }
          }
        }
      },
      legend: {
        item: {
          // disable click on legend
          onclick: function() {
            return false;
          }
        },
        show: this.showLegend
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
    const elements: any = this.elementRef.nativeElement.getElementsByClassName('bb-axis-x');
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
    } else if (elementsDisplayedNo < 150 ) {
      element.classList.add('bb-axis-x-2n');
      element.classList.remove('bb-axis-x-n');
      element.classList.remove('bb-axis-x-3n');
      element.classList.remove('bb-axis-x-5n');
    } else if (elementsDisplayedNo < 250 ) {
      element.classList.add('bb-axis-x-3n');
      element.classList.remove('bb-axis-x-n');
      element.classList.remove('bb-axis-x-2n');
      element.classList.remove('bb-axis-x-5n');
    } else {
      element.classList.add('bb-axis-x-5n');
      element.classList.remove('bb-axis-x-n');
      element.classList.remove('bb-axis-x-2n');
      element.classList.remove('bb-axis-x-3n');
    }
  }

}
