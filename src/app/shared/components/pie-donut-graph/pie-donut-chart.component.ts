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
    readonly label: string;
    readonly color: string;
    readonly value: number;
    readonly id: string;

    /**
     * Create data object
     */
    constructor(data: {
        // data
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

    // chart id generator
    chartId: string = uuid();

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

        // redraw
        this.redrawGraph();
    }
    get data(): PieDonutChartData[] {
        return this._data;
    }

    // graph title
    @Input() graphTitle: string;

    // graph legend title
    @Input() legendTitle: string;

    // click item
    @Output() clickItem = new EventEmitter<PieDonutChartData>();

    // job handler
    private _periodicChecker: number;

    // graph internal elements
    private _graph: {
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
        arcs: IArcsWithExtraDetails[]
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
                donutRadiusMultiplier: 0.8,
                linesInnerRadius: 10,
                selected: {
                    radiusIncrease: 5,
                    speed: 200
                }
            },
            shadow: {
                color: '#CDCDCD',
                width: 10,
                opacity: 0.6
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
        arcs: []
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
        const height: number = this.chartContainer.nativeElement.clientHeight - 4;

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
        const shadowFilter = this._graph.defs
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

        // drop inner shadow
        const shadowOuterRadius: number = donutRadius * this._graph.settings.donut.donutRadiusMultiplier;
        groupShadow
            .append('path')
            .attr('d', d3.arc()
                .startAngle(0)
                .endAngle(360)
                .innerRadius(shadowOuterRadius - this._graph.settings.shadow.width)
                .outerRadius(shadowOuterRadius)
            )
            .attr(
                'fill',
                this._graph.settings.shadow.color
            )
            .attr('filter', 'url(#blurFilter)')
            .style('opacity', this._graph.settings.shadow.opacity);
    }

    /**
     * Animate in
     */
    private mouseIn(item: IArcsWithExtraDetails): void {
        // arc generators
        const donutRadius: number = this.getDonutRadius();
        const donutArcD3Selected = d3.arc()
            .innerRadius((donutRadius + this._graph.settings.donut.selected.radiusIncrease) * this._graph.settings.donut.donutRadiusMultiplier)
            .outerRadius(donutRadius + this._graph.settings.donut.selected.radiusIncrease);
        const linesArcD3Selected = d3.arc()
            .innerRadius(this._graph.settings.donut.linesInnerRadius)
            .outerRadius(donutRadius + this._graph.settings.donut.selected.radiusIncrease);

        // animate arc
        d3.select(`#arc${item.details.id}`)
            .transition()
            .duration(this._graph.settings.donut.selected.speed)
            .attr(
                'd',
                donutArcD3Selected(item.arc)
            );

        // animate lines
        d3.select(`#arcLine${item.details.id}`)
            .transition()
            .duration(this._graph.settings.donut.selected.speed)
            .attr(
                'd',
                linesArcD3Selected(item.arc)
            );
    }

    /**
     * Animate out
     */
    private mouseOut(item: IArcsWithExtraDetails): void {
        // arc generators
        const donutArcD3 = this.getDonutArcD3();
        const linesArcD3 = this.getLinesArcD3();

        // animate arc
        d3.select(`#arc${item.details.id}`)
            .transition()
            .duration(this._graph.settings.donut.selected.speed)
            .attr(
                'd',
                donutArcD3(item.arc)
            );

        // animate lines
        d3.select(`#arcLine${item.details.id}`)
            .transition()
            .duration(this._graph.settings.donut.selected.speed)
            .attr(
                'd',
                linesArcD3(item.arc)
            );
    }

    /**
     * Get donut arc d3
     */
    private getDonutArcD3(): any {
        const donutRadius: number = this.getDonutRadius();
        return d3.arc()
            .innerRadius(donutRadius * this._graph.settings.donut.donutRadiusMultiplier)
            .outerRadius(donutRadius);
    }

    /**
     * Get lines arc d3
     */
    private getLinesArcD3(): any {
        const donutRadius: number = this.getDonutRadius();
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
        const arcs = pie(this.data.map((item) => item.value));

        // change data into a proper format supported by d3
        this._graph.arcs = [];
        arcs.forEach((arc, index) => {
            this._graph.arcs.push({
                details: this.data[index],
                arc
            });
        });

        // group data arcs
        const groupArcs = this._graph.svg.append('g');
        groupArcs.attr('transform', translate);
        const groupArcsData = groupArcs.selectAll('*').data(this._graph.arcs).enter();

        // define arc renderers
        const self = this;
        const donutArcD3 = this.getDonutArcD3();
        const linesArcD3 = this.getLinesArcD3();

        // render outer arc
        groupArcsData
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
                    return donutArcD3(item.arc);
                }
            )
            .attr(
                'fill',
                (d: IArcsWithExtraDetails): any => {
                    return d.details.color;
                }
            )
            .on(
                'mouseover',
                function () {
                    // animate
                    self.mouseIn((this as any).__data__);
                }
            )
            .on(
                'mouseout',
                function () {
                    // animate
                    self.mouseOut((this as any).__data__);
                }
            )
            .on(
                'click',
                function () {
                    // arc data
                    const item: IArcsWithExtraDetails = (this as any).__data__;

                    // trigger click event
                    self.clickItem.emit(item.details);
                }
            );

        // render inner arc
        groupArcsData
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
                    return linesArcD3(item.arc);
                }
            )
            .attr(
                'fill',
                'none'
            )
            .attr(
                'stroke',
                this._graph.settings.arc.border.color
            )
            .style(
                'stroke-width',
                this._graph.settings.arc.border.width
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
        const translate: string = 'translate(' + (this._graph.size.width - donutRadius - this._graph.settings.margin) + ', ' + (this._graph.size.height / 2) + ')';

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
        this.mouseIn(arc);
    }

    /**
     * Find and deselect graph arc
     */
    findAndDeselectArc(item: PieDonutChartData): void {
        // find arc item
        const arc: IArcsWithExtraDetails = this.findArcFromChartDataItem(item);

        // nothing to animate ?
        if (!arc) {
            return;
        }

        // mouse in
        this.mouseOut(arc);
    }
}
