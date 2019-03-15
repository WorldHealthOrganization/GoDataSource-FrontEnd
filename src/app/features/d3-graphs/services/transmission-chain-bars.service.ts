import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import * as moment from 'moment';

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

    drawGraph(container: any, data: any) {
        // create graph container
        const canvas = d3
            .select(container)
            .append('svg')
            .attr('width', this.determineGraphWidth(data))
            .attr('height', this.determineGraphHeight(data));

        // draw the dates column
        this.drawDates(canvas, data);

        // draw each case column
        Object.values(data.cases).forEach((caseData, index) => {
            this.drawCase(canvas, index, caseData, data);
        });
    }

    /**
     * Draw the first column (with all the dates in the graph)
     */
    drawDates(canvas, data) {
        // draw the first cell (placeholder for dates column and visual IDs row)
        canvas.append('rect')
            .attr('fill', 'transparent')
            .attr('width', this.dateCellWidth)
            .attr('height', this.visualIdCellHeight);

        // draw each date
        Object.keys(data.dates).forEach((dayDate, index) => {
            // set position (top-left corner)
            const dateContainer = canvas.append('svg')
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
    drawCase(canvas, idx, caseData, data) {
        // draw the case column container
        const caseColumnContainer = canvas.append('svg')
            .attr('x', this.dateCellWidth + (idx * (this.marginBetween + this.cellWidth)))
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
                .attr('transform', `translate(0, ${this.visualIdCellHeight + (data.dates[isolation.date] * this.cellHeight)})`);
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
                .attr('transform', `translate(0, ${this.visualIdCellHeight + (data.dates[labResult.date] * this.cellHeight)})`);
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
            .attr('y', this.visualIdCellHeight + (data.dates[caseData.firstGraphDate] * this.cellHeight));
        caseBar.append('rect')
            .attr('width', this.cellWidth)
            .attr('height', (moment(caseData.lastGraphDate).diff(moment(caseData.firstGraphDate), 'days') + 1) * this.cellHeight)
            .attr('fill', 'transparent')
            .attr('stroke', 'black')
            .attr('stroke-width', '1')
            // .attr('shape-rendering', 'crispEdges');
            .attr('shape-rendering', 'optimizeQuality');
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

