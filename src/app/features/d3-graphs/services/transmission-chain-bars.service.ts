import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import * as moment from 'moment';
import * as _ from 'lodash';

@Injectable()
export class TransmissionChainBarsService {
    // regular cell width
    private cellWidth = 50;
    // regular cell height
    private cellHeight = 25;
    // space between cases
    private marginBetween = 7;
    // date cell width (first column)
    private dateCellWidth = 120;
    // case visual ID cell height (first row)
    private visualIdCellHeight = 80;

    // SVG container for the graph
    private canvas: any;
    // data used to draw the graph
    private graphData: any;

    // cases map (by uid) to know the column index of each case
    private caseColumnMap = {};
    // current column index where a new case will be drawn
    private currentColumnIdx = 0;
    // keep the relations that were already drawn, to avoid duplicates
    //      this.drawnRelations[sourceCaseId][targetCaseId] = true
    private drawnRelations = {};

    drawGraph(container: any, data: any) {
        // clear current graph before redrawing
        d3.select(container).selectAll('*').remove();

        // reset graph data
        this.caseColumnMap = {};
        this.currentColumnIdx = 0;
        this.drawnRelations = {};

        // create graph container
        const canvas = d3
            .select(container)
            .append('svg')
            .attr('width', this.determineGraphWidth(data))
            .attr('height', this.determineGraphHeight(data));

        // cache common data
        this.canvas = canvas;
        this.graphData = data;

        // draw the dates column
        this.drawDates();

        // draw each case column
        Object.values(data.cases).forEach((caseData, index) => {
            // did we already draw this case?
            if (this.caseColumnMap[caseData.id] === undefined) {
                this.drawCase(caseData.id);
            }
        });

        // draw axis on hover
        this.drawAxisOnHover();
    }

    /**
     * Draw the first column (with all the dates in the graph)
     */
    private drawDates() {
        // draw the first cell (placeholder for dates column and visual IDs row)
        this.canvas.append('rect')
            .attr('fill', 'transparent')
            .attr('width', this.dateCellWidth)
            .attr('height', this.visualIdCellHeight);

        // draw each date
        Object.keys(this.graphData.dates).forEach((dayDate, index) => {
            // set position (top-left corner)
            const dateContainer = this.canvas.append('svg')
                .attr('x', 0)
                .attr('y', this.visualIdCellHeight + index * this.cellHeight);

            const dateGroup = dateContainer.append('g');
            dateGroup.append('rect')
                .attr('fill', 'transparent')
                .attr('width', this.dateCellWidth)
                .attr('height', this.cellHeight);
            dateGroup.append('text')
                .text(dayDate)
                .attr('fill', 'black')
                .attr('alignment-baseline', 'central')
                // center the text vertically
                .attr('y', this.cellHeight / 2);
        });
    }

    /**
     * Draw a case block
     */
    private drawCase(caseId) {
        const caseData = this.graphData.cases[caseId];

        if (!caseData) {
            return;
        }

        // the column where we draw the case
        const caseColumnIdx = this.currentColumnIdx;

        // increment the current column index for when drawing a new case
        this.currentColumnIdx++;
        // add case to the map, so we know it's (already) drawn
        this.caseColumnMap[caseData.id] = caseColumnIdx;

        // draw the case column container
        const caseColumnContainer = this.canvas.append('svg')
            .attr('x', this.dateCellWidth + (caseColumnIdx * (this.marginBetween + this.cellWidth)))
            .attr('y', 0);

        // draw the visual ID cell
        const visualIdGroup = caseColumnContainer.append('g')
            .attr('transform', 'rotate(-58, 25, 40)');
        visualIdGroup.append('text')
            .text(caseData.visualId)
            .attr('fill', 'black')
            .attr('font-size', '12px')
            .attr('alignment-baseline', 'central')
            // center the text vertically
            .attr('y', this.visualIdCellHeight / 2);

        // draw the case isolation cells
        caseData.isolation.forEach((isolation) => {
            const isolationGroup = caseColumnContainer.append('g')
                .attr('transform', `translate(0, ${this.visualIdCellHeight + (this.graphData.dates[isolation.date] * this.cellHeight)})`);
            isolationGroup.append('rect')
                .attr('width', this.cellWidth)
                .attr('height', this.cellHeight)
                .attr('fill', 'steelblue');
            isolationGroup.append('text')
                .text('iso')
                .attr('fill', 'black')
                .attr('alignment-baseline', 'central')
                .attr('text-anchor', 'middle')
                // center the text
                .attr('x', this.cellWidth / 2)
                .attr('y', this.cellHeight / 2);
        });

        // draw the lab results cells
        caseData.labResults.forEach((labResult) => {
            const labResultGroup = caseColumnContainer.append('g')
                .attr('transform', `translate(0, ${this.visualIdCellHeight + (this.graphData.dates[labResult.date] * this.cellHeight)})`);
            labResultGroup.append('rect')
                .attr('width', this.cellWidth)
                .attr('height', this.cellHeight)
                .attr('fill', 'darkred');
            labResultGroup.append('text')
                .text(labResult.result)
                .attr('fill', 'white')
                .attr('alignment-baseline', 'central')
                .attr('text-anchor', 'middle')
                // center the text
                .attr('x', this.cellWidth / 2)
                .attr('y', this.cellHeight / 2);
        });

        // draw the case bar container (to show the border)
        const caseBar = caseColumnContainer.append('svg')
            .attr('x', 0)
            .attr('y', this.visualIdCellHeight + (this.graphData.dates[caseData.firstGraphDate] * this.cellHeight));
        caseBar.append('rect')
            .attr('width', this.cellWidth)
            .attr('height', (moment(caseData.lastGraphDate).diff(moment(caseData.firstGraphDate), 'days') + 1) * this.cellHeight)
            .attr('fill', 'transparent')
            .attr('stroke', 'black')
            .attr('stroke-width', '1')
            // .attr('shape-rendering', 'crispEdges');
            .attr('shape-rendering', 'optimizeQuality');

        // draw case's relations
        if (this.graphData.relationships[caseData.id]) {
            this.graphData.relationships[caseData.id].forEach((targetCaseId) => {
                // need to draw the target case?
                if (this.caseColumnMap[targetCaseId] === undefined) {
                    this.drawCase(targetCaseId);
                }

                // need to draw the relationship?
                if (
                    !this.drawnRelations[caseData.id] ||
                    !this.drawnRelations[caseData.id][targetCaseId]
                ) {
                    this.drawRelationship(caseData.id, targetCaseId);
                }
            });
        }
    }

    /**
     * Draw a relationship between two cases
     */
    private drawRelationship(sourceCaseId, targetCaseId) {
        // get source and target cases column indexes
        const sourceCaseColumnIdx = this.caseColumnMap[sourceCaseId];
        const targetCaseColumnIdx = this.caseColumnMap[targetCaseId];
        // get source and target cases data
        const sourceCaseData = this.graphData.cases[sourceCaseId];
        const targetCaseData = this.graphData.cases[targetCaseId];

        if (
            !_.isNumber(sourceCaseColumnIdx) ||
            !_.isNumber(targetCaseColumnIdx) ||
            !sourceCaseData ||
            !targetCaseData
        ) {
            return;
        }

        // mark the relation as being drawn, to avoid duplicates
        _.set(this.drawnRelations, `[${sourceCaseId}][${targetCaseId}]`, true);

        // start from the vertical middle of the top cell from source case's bar
        // left or right?
        const leftOrRight = (sourceCaseColumnIdx < targetCaseColumnIdx) ? 1 : 0;
        const lineStartX = this.dateCellWidth + (sourceCaseColumnIdx * (this.marginBetween + this.cellWidth)) + (leftOrRight * this.cellWidth);
        const lineStartY = this.visualIdCellHeight + (this.graphData.dates[sourceCaseData.firstGraphDate] * this.cellHeight) + (this.cellHeight / 2);
        // stop at the horizontal middle of the target case's bar
        const lineEndX = this.dateCellWidth + (targetCaseColumnIdx * (this.marginBetween + this.cellWidth)) + (this.cellWidth / 2);
        const lineEndY = lineStartY;
        // draw the arrow at the horizontal middle of the target case's bar, but touching the bar
        const arrowX = lineEndX;
        const arrowY = this.visualIdCellHeight + (this.graphData.dates[targetCaseData.firstGraphDate] * this.cellHeight);

        // draw the horizontal line from the source case to the target case
        this.canvas.append('line')
            .attr('stroke', 'black')
            .attr('stroke-width', '1px')
            .attr('x1', lineStartX)
            .attr('y1', lineStartY)
            .attr('x2', lineEndX)
            .attr('y2', lineEndY);

        // draw the vertical line (arrow's base)
        this.canvas.append('line')
            .attr('stroke', 'black')
            .attr('stroke-width', '1px')
            .attr('x1', lineEndX)
            .attr('y1', lineEndY)
            .attr('x2', arrowX)
            .attr('y2', arrowY);

        // draw the top of the arrow
        this.canvas.append('polygon')
            .attr('fill', 'black')
            .attr('points', `${arrowX},${arrowY} ${arrowX - 5},${(arrowY - 8)} ${arrowX + 5},${arrowY - 8}`);
    }

    /**
     * Draw the axis that show up when user hovers over a certain row or column
     */
    private drawAxisOnHover() {
        const graphWidth = this.dateCellWidth + this.currentColumnIdx * (this.marginBetween + this.cellWidth);

        // draw horizontal rows
        for (let i = 0; i < Object.values(this.graphData.dates).length; i++) {
            this.canvas.append('rect')
                .attr('width', graphWidth)
                .attr('height', this.cellHeight)
                .attr('x', 0)
                .attr('y', this.visualIdCellHeight + (i * this.cellHeight))
                .attr('fill', 'transparent')
                .attr('class', 'axis-hover');
        }
    }

    /**
     * Determine graph width based on the data
     */
    private determineGraphWidth(data): number {
        // date-column-width + cases-no * (margin-between-cases + case-cell-width)
        return this.dateCellWidth + Object.values(data.cases).length * (this.marginBetween + this.cellWidth);
    }

    /**
     * Determine graph height based on the data
     */
    private determineGraphHeight(data): number {
        const daysNo = moment(data.maxDate).diff(moment(data.minDate), 'days') + 1;

        // visual-id-column-height + days-no * cell-height
        return this.visualIdCellHeight + daysNo * this.cellHeight;
    }
}

