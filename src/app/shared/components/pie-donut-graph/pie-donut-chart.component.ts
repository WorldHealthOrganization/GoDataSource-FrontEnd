import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { v4 as uuid } from 'uuid';
import * as d3 from 'd3';
import { Selection } from 'd3-selection';

/**
 * Arc Details
 */
interface IArcsWithExtraDetails {
    details: PieDonutChartData;
    arc: any;
}

/**
 * Donut / Pie graph
 */
export class PieDonutChartData {
    // data
    readonly key: string;
    readonly label: string;
    readonly value: number;
    readonly id: string;
    color: string;
    checked: boolean = true;

    /**
     * Assign colors to data
     */
    static assignColorDomain(data: PieDonutChartData[]): void {
        // go through items and assign color
        data.forEach((item, index) => {
           item.color = '#' + Math.floor(Math.random() * 16777215).toString(16);
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
    private static DEFAULT_GRAPH_SHADOW_MULTIPLIER: number = 0.8;

    // chart id generator
    chartId: string = `chart${uuid()}`;

    // Chart container
    private _chartContainer: ElementRef;
    @ViewChild('chart') set chartContainer(chartContainer: ElementRef) {
        // set data
        this._chartContainer = chartContainer;

        // redraw
        this.redrawGraph();
    }
    get chartContainer(): ElementRef {
        return this._chartContainer;
    }

    // loading graph data ?
    private _loadingData: boolean = false;
    @Input() set loadingData(loadingData: boolean) {
        // set data
        this._loadingData = loadingData;

        // redraw
        this.redrawGraph();
    }
    get loadingData(): boolean {
        return this._loadingData;
    }

    // display data
    private _data: PieDonutChartData[] = [];
    @Input() set data(data: PieDonutChartData[]) {
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
        this.redrawGraph();
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
            donutRadiusShadow: number
        },
        dataToRender: PieDonutChartData[],
        rendered: {
            total: number
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
                opacity: 0.6
            },
            sizeChange: {
                animation: {
                    speed: 200
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
            donutRadius: 30,
            donutRadiusShadow: 30 * PieDonutChartComponent.DEFAULT_GRAPH_SHADOW_MULTIPLIER
        },
        dataToRender: [],
        rendered: {
            total: 0
        }
    };

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
            this._graph.size.width !== width ||
            this._graph.size.height !== height
        ) {
            // update size
            this._graph.size.width = width;
            this._graph.size.height = height;

            // re-render graph
            if (redrawOnChange) {
                this.render();
            }
        }
    }

    /**
     * Redraw graph
     */
    redrawGraph(): void {
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
        this.render();
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
    private clear(): void {
        // clear current graph before redrawing
        this._graph.container.selectAll('*').remove();

        // clear generated arcs
        this._graph.arcs = [];
        this._graph.selectedArc = null;
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

        // animate
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

        // arc generators
        const donutRadius: number = this.getDonutRadius();
        const donutArcD3Selected = d3.arc()
            .innerRadius((donutRadius + this._graph.settings.donut.selected.radiusIncrease) * this._graph.settings.donut.donutRadiusMultiplier)
            .outerRadius(donutRadius + this._graph.settings.donut.selected.radiusIncrease);
        const linesArcD3Selected = d3.arc()
            .innerRadius(this._graph.settings.donut.linesInnerRadius)
            .outerRadius(donutRadius + this._graph.settings.donut.selected.radiusIncrease);

        // animate arc
        d3
            .select(`#${this.chartId}`)
            .select(`#arc${this._graph.selectedArc.details.id}`)
            .transition()
            .duration(this._graph.settings.donut.selected.speed)
            .attr(
                'd',
                donutArcD3Selected(this._graph.selectedArc.arc)
            );

        // animate lines
        d3
            .select(`#${this.chartId}`)
            .select(`#arcLine${this._graph.selectedArc.details.id}`)
            .transition()
            .duration(this._graph.settings.donut.selected.speed)
            .attr(
                'd',
                linesArcD3Selected(this._graph.selectedArc.arc)
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
        const linesArcD3 = this.getLinesArcD3(donutRadius);

        // animate arc
        d3
            .select(`#${this.chartId}`)
            .select(`#arc${this._graph.selectedArc.details.id}`)
            .transition()
            .duration(this._graph.settings.donut.selected.speed)
            .attr(
                'd',
                donutArcD3(this._graph.selectedArc.arc)
            );

        // animate lines
        d3
            .select(`#${this.chartId}`)
            .select(`#arcLine${this._graph.selectedArc.details.id}`)
            .transition()
            .duration(this._graph.settings.donut.selected.speed)
            .attr(
                'd',
                linesArcD3(this._graph.selectedArc.arc)
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
     * Get lines arc d3
     */
    private getLinesArcD3(donutRadius: number): any {
        return d3.arc()
            .innerRadius(this._graph.settings.donut.linesInnerRadius)
            .outerRadius(donutRadius);
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
                arc
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
                    return donutArcD3Previous(item.arc);
                }
            ).attr(
                'fill',
                (d: IArcsWithExtraDetails): any => {
                    return d.details.color;
                }
            );

        // animate
        arcPath
            .transition()
            .duration(this._graph.settings.sizeChange.animation.speed)
            .attr(
                'd',
                (item): any => {
                    return donutArcD3(item.arc);
                }
            );

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
                function () {
                    // animate
                    self.mouseIn(
                        (this as any).__data__,
                        true
                    );
                }
            )
            .on(
                'mouseout',
                function () {
                    // animate
                    self.mouseOut();
                }
            )
            .on(
                'click',
                function () {
                    // trigger click event
                    self.clickItem.emit((this as any).__data__.details);
                }
            );

        // animate
        linePath
            .transition()
            .duration(this._graph.settings.sizeChange.animation.speed)
            .attr(
                'd',
                (item): any => {
                    return linesArcD3(item.arc);
                }
            );
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
    private render(): void {
        // determine
        this.determineGraphContainer();

        // clear graph
        this.clear();

        // nothing to draw ?
        if (
            !this.data ||
            this.data.length < 1
        ) {
            return;
        }

        // determine data that we need to render
        this._graph.dataToRender = this.data.filter((item) => item.checked);

        // nothing to draw ?
        if (this._graph.dataToRender.length < 1) {
            return;
        }

        // wait for binding before determining total otherwise we get expression changed error
        setTimeout(() => {
            // reset
            this._graph.rendered = {
                total: 0
            };

            // deter,ine total
            this._graph.dataToRender.forEach((item) => {
                this._graph.rendered.total += item.value;
            });
        });

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

        // show / hide chart arcs
        this.redrawGraph();
    }
}
