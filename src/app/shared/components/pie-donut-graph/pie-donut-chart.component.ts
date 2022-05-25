import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { v4 as uuid } from 'uuid';
import * as d3 from 'd3';
import { Selection } from 'd3-selection';
import { Observable, throwError } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { catchError } from 'rxjs/operators';
import { ToastV2Service } from '../../../core/services/helper/toast-v2.service';

/**
 * Arc
 */
interface IArcsWithExtraDetailsArc {
  data: any;
  endAngle: number;
  index: number;
  padAngle: number;
  startAngle: number;
  value: number;
}

/**
 * Arc Details
 */
interface IArcsWithExtraDetails {
  details: PieDonutChartData;
  arc: IArcsWithExtraDetailsArc;
  previousArc?: IArcsWithExtraDetailsArc;
}

/**
 * Donut / Pie graph
 */
export class PieDonutChartData {
  // data
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly valueText: string;
  readonly id: string;
  color: string;
  checked: boolean = true;

  /**
   * Assign colors to data
   */
  static assignColorDomain(data: PieDonutChartData[]): void {
    // colors map
    const colors: string[] = [
      '#800080',
      '#008080',
      '#000080',
      '#808000',
      '#800000',
      '#FF00FF',
      '#0000FF',
      '#00FFFF',
      '#008000',
      '#00FF00',
      '#FFFF00',
      '#FF0000',
      '#000000',
      '#808080'
    ];

    // go through items and assign color
    data.forEach((item, index) => {
      item.color = colors[index % colors.length];
    });
  }

  /**
   * Create data object
   */
  constructor(data: {
    // data
    key: string,
    label: string,
    color: string,
    value: number
  }) {
    // set data
    Object.assign(
      this,
      data
    );

    // generate unique id
    this.id = uuid();

    // convert value to text
    this.valueText = this.value ?
      this.value.toLocaleString('en') :
      '0';
  }
}

@Component({
  selector: 'app-pie-donut-chart',
  templateUrl: './pie-donut-chart.component.html',
  styleUrls: ['./pie-donut-chart.component.less']
})
export class PieDonutChartComponent
implements OnInit, OnDestroy {

  // constants
  private static MIN_WIDTH_DIFFERENCE_BEFORE_RERENDER: number = 10;
  private static DEFAULT_GRAPH_DONUT_INITIAL_SIZE: number = 30;
  private static DEFAULT_GRAPH_SHADOW_MULTIPLIER: number = 0.8;

  // chart id generator
  chartId: string = `chart${uuid()}`;

  // Chart container
  private _chartContainer: ElementRef;
  @ViewChild('chart') set chartContainer(chartContainer: ElementRef) {
    // set data
    this._chartContainer = chartContainer;

    // redraw after elements are rendered accordingly to new bindings
    // loading spinner was removed from dom after graph became visible even if chart is on else in *ngIf which was causing multiple size changes
    setTimeout(() => {
      this.redrawGraph(false);
    });
  }
  get chartContainer(): ElementRef {
    return this._chartContainer;
  }

  // detect changes
  @Output() detectChanges = new EventEmitter<void>();

  // loading graph data ?
  loadingData: boolean = true;

  // get data
  private _retrievedData: boolean;
  private _getDataSubscription: Subscription;
  private _getData$: Observable<PieDonutChartData[]>;
  @Input() set getData$(getData$: Observable<PieDonutChartData[]>) {
    // set data
    this._getData$ = getData$;
    this._retrievedData = false;

    // retrieve data if expanded
    this.retrieveData();
  }

  // display data
  private _data: PieDonutChartData[] = [];
  set data(data: PieDonutChartData[]) {
    // validate data
    (data || []).forEach((item) => {
      if (!(item instanceof PieDonutChartData)) {
        throw new Error('Only PieDonutChartData accepted');
      }
    });

    // set data
    this._data = Array.isArray(data) ?
      data :
      [];

    // sort array descending
    this._data.sort((item1, item2): number => {
      return item2.value - item1.value;
    });

    // redraw
    this.redrawGraph(false);
  }
  get data(): PieDonutChartData[] {
    return this._data;
  }

  // graph title
  @Input() graphTitle: string;

  // total
  @Input() graphTotal: string;

  // description
  @Input() description: string;

  // graph no data label
  @Input() noDataLabel: string;

  // click item
  @Output() clickItem = new EventEmitter<PieDonutChartData>();

  // job handler
  private _periodicChecker: number;

  // graph internal elements
  _graph: {
    // graph settings
    settings: {
      margin: number,
      arc: {
        border: {
          width: string,
          color: string
        }
      },
      donut: {
        donutRadiusMultiplier: number,
        linesInnerRadius: number,
        selected: {
          radiusIncrease: number,
          speed: number
        }
      },
      shadow: {
        color: string,
        width: number,
        opacity: number
      },
      sizeChange: {
        animation: {
          speed: number
        }
      },
      renderedArcsChange: {
        animation: {
          speed: number
        }
      }
    },

    // graph size
    size: {
      width: number,
      height: number
    }

    // html elements
    container: Selection<any, any, HTMLElement, any>,
    svg: Selection<any, any, any, any>,
    defs: Selection<any, any, any, any>,
    arcs: IArcsWithExtraDetails[],
    selectedArc: IArcsWithExtraDetails,
    previous: {
      donutRadius: number,
      donutRadiusShadow: number,
      arcs: {
        [arcId: string]: IArcsWithExtraDetails
      }
    },
    dataToRender: PieDonutChartData[],
    rendered: {
      totalNo: number,
      total: string
    }
  } = {
      // graph settings
      settings: {
        margin: 10,
        arc: {
          border: {
            width: '1px',
            color: '#DDD'
          }
        },
        donut: {
          donutRadiusMultiplier: PieDonutChartComponent.DEFAULT_GRAPH_SHADOW_MULTIPLIER,
          linesInnerRadius: 10,
          selected: {
            radiusIncrease: 7,
            speed: 200
          }
        },
        shadow: {
          color: '#CDCDCD',
          width: 10,
          opacity: 0.5
        },
        sizeChange: {
          animation: {
            speed: 200
          }
        },
        renderedArcsChange: {
          animation: {
            speed: 750
          }
        }
      },

      // graph size
      size: {
        width: 0,
        height: 0
      },

      // html elements
      container: null,
      svg: null,
      defs: null,
      arcs: [],
      selectedArc: null,
      previous: {
        donutRadius: PieDonutChartComponent.DEFAULT_GRAPH_DONUT_INITIAL_SIZE,
        donutRadiusShadow: PieDonutChartComponent.DEFAULT_GRAPH_DONUT_INITIAL_SIZE * PieDonutChartComponent.DEFAULT_GRAPH_SHADOW_MULTIPLIER,
        arcs: {}
      },
      dataToRender: [],
      rendered: {
        totalNo: 0,
        total: '0'
      }
    };

  // expanded / collapsed ?
  private _expanded: boolean = false;
  set expanded(expanded: boolean) {
    // set data
    this._expanded = expanded;

    // retrieve data if expanded and data not retrieved
    this.retrieveData();
  }
  get expanded(): boolean {
    return this._expanded;
  }

  /**
   * Constructor
   */
  constructor(
    private toastV2Service: ToastV2Service
  ) {}

  /**
     * Component initialized
     */
  ngOnInit() {
    // start size checker
    this.startPeriodicChecks();
  }

  /**
     * Remove component resources
     */
  ngOnDestroy() {
    // stop size checker
    this.releasePeriodicChecks();

    // release retrieve data
    if (this._getDataSubscription) {
      this._getDataSubscription.unsubscribe();
      this._getDataSubscription = undefined;
    }
  }

  /**
     * Release periodic checker
     */
  private releasePeriodicChecks(): void {
    clearTimeout(this._periodicChecker);
  }

  /**
     * Job that checks periodically different things
     */
  private startPeriodicChecks(): void {
    // stop previous size checker
    this.releasePeriodicChecks();

    // execute periodic checker
    this._periodicChecker = setTimeout(() => {
      // check size
      this.updateGraphSize(true);

      // call again later
      this.startPeriodicChecks();
    }, 100);
  }

  /**
     * Update graph size
     */
  private updateGraphSize(redrawOnChange: boolean): void {
    // no size to determine ?
    if (
      !this.chartContainer ||
      !this.chartContainer.nativeElement ||
      this.loadingData
    ) {
      return;
    }

    // determine graph size
    const width: number = this.chartContainer.nativeElement.clientWidth;
    const height: number = this.chartContainer.nativeElement.clientHeight - 5;

    // size changed, if so we need to redraw ?
    if (
      Math.abs(this._graph.size.width - width) > PieDonutChartComponent.MIN_WIDTH_DIFFERENCE_BEFORE_RERENDER ||
            Math.abs(this._graph.size.height - height) > PieDonutChartComponent.MIN_WIDTH_DIFFERENCE_BEFORE_RERENDER
    ) {
      // update size
      this._graph.size.width = width;
      this._graph.size.height = height;

      // re-render graph
      if (redrawOnChange) {
        this.render(true);
      }
    }
  }

  /**
     * Redraw graph
     */
  redrawGraph(partialClear: boolean): void {
    // do we have the item where we need to redraw graph ?
    // or still waiting for data ?
    if (
      !this.chartContainer ||
      this.loadingData
    ) {
      return;
    }

    // check size
    this.updateGraphSize(false);

    // draw
    this.render(partialClear);
  }

  /**
     * Determine graph container
     */
  private determineGraphContainer(): void {
    this._graph.container = d3.select(this.chartContainer.nativeElement);
  }

  /**
     * Clear graph
     */
  private clear(partialClear: boolean): void {
    // clear current graph before redrawing
    this._graph.container.selectAll('*').remove();

    // clear generated arcs
    this._graph.arcs = [];
    this._graph.selectedArc = null;

    // full clear ?
    if (!partialClear) {
      this._graph.previous = {
        donutRadius: PieDonutChartComponent.DEFAULT_GRAPH_DONUT_INITIAL_SIZE,
        donutRadiusShadow: PieDonutChartComponent.DEFAULT_GRAPH_DONUT_INITIAL_SIZE * PieDonutChartComponent.DEFAULT_GRAPH_SHADOW_MULTIPLIER,
        arcs: {}
      };
    }
  }

  /**
     * Initialize graph base
     */
  private initGraphBase(): void {
    // create SVG container
    this._graph.svg = this._graph.container.append('svg')
      .attr('width', `${this._graph.size.width}px`)
      .attr('height', `${this._graph.size.height}px`);

    // create defs used for filters and others
    this._graph.defs = this._graph.svg.append('defs');
  }

  /**
     * Draw pie inner shadow
     */
  private drawPieDonutChartShadow(
    donutRadius: number,
    translate: string
  ): void {
    // create shadow filter
    this._graph.defs
      .append('filter')
      .attr(
        'id',
        'blurFilter'
      )
      .append('feGaussianBlur')
      .attr('stdDeviation', 5);

    // create shadow group handler
    const groupShadow = this._graph.svg.append('g');
    groupShadow.attr('transform', translate);

    // radius
    const shadowOuterRadius: number = donutRadius * this._graph.settings.donut.donutRadiusMultiplier;

    // drop inner shadow
    const shadowPath = groupShadow
      .append('path')
      .attr('d', d3.arc()
        .startAngle(0)
        .endAngle(360)
        .innerRadius(this._graph.previous.donutRadiusShadow - this._graph.settings.shadow.width)
        .outerRadius(this._graph.previous.donutRadiusShadow)
      )
      .attr(
        'fill',
        this._graph.settings.shadow.color
      )
      .attr('filter', 'url(#blurFilter)')
      .style('opacity', this._graph.settings.shadow.opacity);

    // animate only if necessary
    if (this._graph.previous.donutRadiusShadow !== shadowOuterRadius) {
      shadowPath
        .transition()
        .duration(this._graph.settings.sizeChange.animation.speed)
        .attr(
          'd',
          d3.arc()
            .startAngle(0)
            .endAngle(360)
            .innerRadius(shadowOuterRadius - this._graph.settings.shadow.width)
            .outerRadius(shadowOuterRadius)
        );
    }

    // update donut radius
    this._graph.previous.donutRadiusShadow = shadowOuterRadius;
  }

  /**
     * Animate in
     */
  private mouseIn(
    item: IArcsWithExtraDetails,
    scrollLegendItem: boolean
  ): void {
    // same item already selected ?
    if (
      this._graph.selectedArc &&
            item.details.id === this._graph.selectedArc.details.id
    ) {
      return;
    }

    // deselect previous item
    this.mouseOut();

    // set selected item
    this._graph.selectedArc = item;

    // no need to animate for 0 values
    if (this._graph.selectedArc.details.value === 0) {
      return;
    }

    // arc generators
    const donutRadius: number = this.getDonutRadius();
    const donutArcD3 = this.getDonutArcD3(donutRadius);
    const donutArcD3Selected = this.getDonutArcD3Selected(donutRadius);
    const linesArcD3 = this.getLinesArcD3(donutRadius);
    const linesArcD3Selected = this.getLinesArcD3Selected(donutRadius);

    // animate arc
    d3
      .select(`#${this.chartId}`)
      .select(`#arc${this._graph.selectedArc.details.id}`)
      .transition()
      .duration(this._graph.settings.donut.selected.speed)
      .attrTween(
        'd',
        (animateItem: IArcsWithExtraDetails): any => {
          // interpolate
          const d3Interpolate = d3.interpolate(
            donutArcD3(animateItem.arc),
            donutArcD3Selected(animateItem.arc)
          );

          // animate
          return (t) => {
            return d3Interpolate(t);
          };
        }
      );

    // animate lines
    d3
      .select(`#${this.chartId}`)
      .select(`#arcLine${this._graph.selectedArc.details.id}`)
      .transition()
      .duration(this._graph.settings.donut.selected.speed)
      .attrTween(
        'd',
        (animateItem: IArcsWithExtraDetails): any => {
          // interpolate
          const d3Interpolate = d3.interpolate(
            linesArcD3(animateItem.arc),
            linesArcD3Selected(animateItem.arc)
          );

          // animate
          return (t) => {
            return d3Interpolate(t);
          };
        }
      );

    // see legend
    if (scrollLegendItem) {
      const legendItem = document.querySelector(`#${this.chartId} #legend${this._graph.selectedArc.details.id}`);
      if (
        legendItem &&
                legendItem.scrollIntoView
      ) {
        legendItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'start'
        });
      }
    }
  }

  /**
     * Animate out
     */
  private mouseOut(): void {
    // nothing to deselect ?
    if (!this._graph.selectedArc) {
      return;
    }

    // arc generators
    const donutRadius: number = this.getDonutRadius();
    const donutArcD3 = this.getDonutArcD3(donutRadius);
    const donutArcD3Selected = this.getDonutArcD3Selected(donutRadius);
    const linesArcD3 = this.getLinesArcD3(donutRadius);
    const linesArcD3Selected = this.getLinesArcD3Selected(donutRadius);

    // animate arc
    d3
      .select(`#${this.chartId}`)
      .select(`#arc${this._graph.selectedArc.details.id}`)
      .transition()
      .duration(this._graph.settings.donut.selected.speed)
      .attrTween(
        'd',
        (animateItem: IArcsWithExtraDetails): any => {
          // interpolate
          const d3Interpolate = d3.interpolate(
            donutArcD3Selected(animateItem.arc),
            donutArcD3(animateItem.arc)
          );

          // animate
          return (t) => {
            return d3Interpolate(t);
          };
        }
      );

    // animate lines
    d3
      .select(`#${this.chartId}`)
      .select(`#arcLine${this._graph.selectedArc.details.id}`)
      .transition()
      .duration(this._graph.settings.donut.selected.speed)
      .attrTween(
        'd',
        (animateItem: IArcsWithExtraDetails): any => {
          // interpolate
          const d3Interpolate = d3.interpolate(
            linesArcD3Selected(animateItem.arc),
            linesArcD3(animateItem.arc)
          );

          // animate
          return (t) => {
            return d3Interpolate(t);
          };
        }
      );

    // deselect arc
    this._graph.selectedArc = null;
  }

  /**
     * Get donut arc d3
     */
  private getDonutArcD3(donutRadius: number): any {
    return d3.arc()
      .innerRadius(donutRadius * this._graph.settings.donut.donutRadiusMultiplier)
      .outerRadius(donutRadius);
  }

  /**
     * Get donut arc d3 selected
     */
  private getDonutArcD3Selected(donutRadius: number): any {
    return d3.arc()
      .innerRadius((donutRadius + this._graph.settings.donut.selected.radiusIncrease) * this._graph.settings.donut.donutRadiusMultiplier)
      .outerRadius(donutRadius + this._graph.settings.donut.selected.radiusIncrease);
  }

  /**
     * Get lines arc d3
     */
  private getLinesArcD3(donutRadius: number): any {
    return d3.arc()
      .innerRadius(this._graph.settings.donut.linesInnerRadius)
      .outerRadius(donutRadius);
  }

  /**
     * Get lines arc d3 selected
     */
  private getLinesArcD3Selected(donutRadius: number): any {
    return d3.arc()
      .innerRadius(this._graph.settings.donut.linesInnerRadius)
      .outerRadius(donutRadius + this._graph.settings.donut.selected.radiusIncrease);
  }

  /**
     * Draw pie inner shadow
     */
  private drawPieDonutChartArcs(
    translate: string
  ): void {
    // determine donut arcs
    const pie = d3.pie();
    const arcs = pie(this._graph.dataToRender.map((item) => item.value));

    // change data into a proper format supported by d3
    this._graph.arcs = [];
    arcs.forEach((arc, index) => {
      this._graph.arcs.push({
        details: this._graph.dataToRender[index],
        arc,
        previousArc: this._graph.previous.arcs[this._graph.dataToRender[index].id] ?
          this._graph.previous.arcs[this._graph.dataToRender[index].id].previousArc :
          undefined
      });
    });

    // group data arcs
    const groupArcs = this._graph.svg.append('g');
    groupArcs.attr('transform', translate);
    const groupArcsData = groupArcs.selectAll('*').data(this._graph.arcs).enter();

    // define arc renderers
    const self = this;
    const donutRadius: number = this.getDonutRadius();
    const donutArcD3Previous = this.getDonutArcD3(this._graph.previous.donutRadius);
    const donutArcD3 = this.getDonutArcD3(donutRadius);
    const linesArcD3Previous = this.getLinesArcD3(this._graph.previous.donutRadius);
    const linesArcD3 = this.getLinesArcD3(donutRadius);

    // update donut radius
    this._graph.previous.donutRadius = donutRadius;

    // render outer arc
    let sizeChanged: boolean = false;
    const arcPath = groupArcsData
      .append('path')
      .style(
        'cursor',
        'pointer'
      )
      .attr(
        'class',
        'arc-selected'
      )
      .attr(
        'id',
        (item): any => {
          return `arc${item.details.id}`;
        }
      )
      .attr(
        'd',
        (item): any => {
          // starting arc same as ending arc, do we need to animate ?
          const initialArcData: string = donutArcD3Previous(item.arc);
          if (
            !sizeChanged &&
                        initialArcData !== donutArcD3(item.arc)
          ) {
            sizeChanged = true;
          }

          // init arc if necessary
          if (!this._graph.previous.arcs[item.details.id]) {
            this._graph.previous.arcs[item.details.id] = item;
          }

          // set initial previous arc if history not found
          if (!this._graph.previous.arcs[item.details.id].previousArc) {
            this._graph.previous.arcs[item.details.id].previousArc = Object.assign(
              {},
              item.arc,
              {
                startAngle: item.arc.endAngle
              }
            );
          }

          // starting arc
          return initialArcData;
        }
      ).attr(
        'fill',
        (d: IArcsWithExtraDetails): any => {
          return d.details.color;
        }
      );

    // animate only if necessary
    if (sizeChanged) {
      arcPath
        .transition()
        .duration(this._graph.settings.sizeChange.animation.speed)
        .attr(
          'd',
          (item): any => {
            return donutArcD3(item.arc);
          }
        );
    } else {
      arcPath
        .transition()
        .duration(this._graph.settings.renderedArcsChange.animation.speed)
        .attrTween(
          'd',
          (item): any => {
            // interpolate
            const d3Interpolate = d3.interpolate(
              this._graph.previous.arcs[item.details.id]?.previousArc,
              item.arc
            );

            // remember previous position
            // handled bellow in line animation

            // animate
            return function(t) {
              return donutArcD3(d3Interpolate(t));
            };
          }
        );
    }

    // render inner arc
    const linePath = groupArcsData
      .append('path')
      .attr(
        'id',
        (item): any => {
          return `arcLine${item.details.id}`;
        }
      )
      .attr(
        'd',
        (item): any => {
          return linesArcD3Previous(item.arc);
        }
      )
    // transparent, and not NONE, because we need to use mouseover
      .attr(
        'fill',
        'transparent'
      )
      .attr(
        'stroke',
        this._graph.settings.arc.border.color
      )
      .style(
        'stroke-width',
        this._graph.settings.arc.border.width
      )
      .on(
        'mouseover',
        function() {
          // animate
          self.mouseIn(
            (this as any).__data__,
            true
          );
        }
      )
      .on(
        'mouseout',
        function() {
          // animate
          self.mouseOut();
        }
      )
      .on(
        'click',
        function() {
          // trigger click event
          self.clickItem.emit((this as any).__data__.details);
        }
      );

    // animate only if necessary
    if (sizeChanged) {
      linePath
        .transition()
        .duration(this._graph.settings.sizeChange.animation.speed)
        .attr(
          'd',
          (item): any => {
            // remember previous position
            if (this._graph.previous.arcs[item.details.id]) {
              this._graph.previous.arcs[item.details.id].previousArc = item.arc;
            }

            // finish
            return linesArcD3(item.arc);
          }
        );
    } else {
      linePath
        .transition()
        .duration(this._graph.settings.renderedArcsChange.animation.speed)
        .attrTween(
          'd',
          (item): any => {
            // interpolate
            const d3Interpolate = d3.interpolate(
              this._graph.previous.arcs[item.details.id]?.previousArc,
              item.arc
            );

            // remember previous position
            if (this._graph.previous.arcs[item.details.id]) {
              this._graph.previous.arcs[item.details.id].previousArc = item.arc;
            }

            // animate
            return function(t) {
              return linesArcD3(d3Interpolate(t));
            };
          }
        );
    }
  }

  /**
     * Donut radius
     */
  private getDonutRadius(): number {
    return Math.min(this._graph.size.width, this._graph.size.height) / 2 - this._graph.settings.margin;
  }

  /**
     * Draw the actual chart
     */
  private drawPieDonutChart(): void {
    // determine pie radius - max to fit graph boundaries
    const donutRadius: number = this.getDonutRadius();
    const translate: string = 'translate(' + (this._graph.size.width / 2) + ', ' + (this._graph.size.height / 2) + ')';

    // draw shadows
    this.drawPieDonutChartShadow(
      donutRadius,
      translate
    );

    // draw arcs
    this.drawPieDonutChartArcs(
      translate
    );
  }

  /**
     * Render graph
     */
  private render(partialClear: boolean): void {
    // determine
    this.determineGraphContainer();

    // clear graph
    this.clear(partialClear);

    // nothing to draw ?
    if (
      !this.data ||
            this.data.length < 1
    ) {
      return;
    }

    // determine data that we need to render
    this._graph.dataToRender = this.data.filter((item) => item.checked);

    // wait for binding before determining total otherwise we get expression changed error
    setTimeout(() => {
      // reset
      this._graph.rendered = {
        totalNo: 0,
        total: '0'
      };

      // deter,ine total
      this._graph.dataToRender.forEach((item) => {
        this._graph.rendered.totalNo += item.value;
        this._graph.rendered.total = this._graph.rendered.totalNo.toLocaleString('en');
      });
    });

    // nothing to draw ?
    if (this._graph.dataToRender.length < 1) {
      return;
    }

    // init graph base
    this.initGraphBase();

    // draw pie chart
    this.drawPieDonutChart();
  }

  /**
   * Find arc item
   */
  private findArcFromChartDataItem(item: PieDonutChartData): IArcsWithExtraDetails {
    // no graph data ?
    if (
      !this._graph ||
            !this._graph.arcs ||
            this._graph.arcs.length < 1
    ) {
      return null;
    }

    // find
    return this._graph.arcs.find((arc) => arc.details.id === item.id);
  }

  /**
   * Find and select graph arc
   */
  findAndSelectArc(item: PieDonutChartData): void {
    // find arc item
    const arc: IArcsWithExtraDetails = this.findArcFromChartDataItem(item);

    // nothing to animate ?
    if (!arc) {
      return;
    }

    // mouse in
    this.mouseIn(
      arc,
      false
    );
  }

  /**
   * Find and deselect graph arc
   */
  findAndDeselectArc(): void {
    this.mouseOut();
  }

  /**
   * Check / uncheck item
   */
  checkUncheckItem(
    item: PieDonutChartData,
    checkedValue: boolean
  ): void {
    // check / uncheck
    item.checked = checkedValue;

    // remove from previous if necessary
    if (!item.checked) {
      delete this._graph.previous.arcs[item.id];
    }

    // show / hide chart arcs
    this.redrawGraph(true);
  }

  /**
   * No need to retrieve ?
   */
  retrieveData(): void {
    // not expanded ?
    if (
      !this.expanded ||
      !this._getData$ ||
      this._retrievedData
    ) {
      return;
    }

    // release previous retrieve data if in progress
    if (this._getDataSubscription) {
      this._getDataSubscription.unsubscribe();
      this._getDataSubscription = undefined;
    }

    // retrieve data
    this._retrievedData = true;
    this.loadingData = true;
    this.detectChanges.emit();
    this._getDataSubscription = this._getData$
      .pipe(catchError((err) => {
        // show error
        this.toastV2Service.error(err);

        // send error down the road
        return throwError(err);
      }))
      .subscribe((data) => {
        // update data
        this.data = data ?
          data :
          [];

        // update progress
        this.loadingData = false;
        this.detectChanges.emit();
      });
  }
}
