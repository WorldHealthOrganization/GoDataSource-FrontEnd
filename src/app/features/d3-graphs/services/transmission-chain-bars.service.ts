import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import * as moment from 'moment';
import * as _ from 'lodash';
import { Constants } from '../../../core/models/constants';
import { TransmissionChainBarsModel } from '../typings/transmission-chain-bars.model';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { CaseBarModel } from '../typings/case-bar.model';
import { Router } from '@angular/router';

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
    // case details cell height (first row)
    private caseDetailsCellHeight = 100;

    // keeping this config centralized in case we need to make the graph configurable by the user
    private graphConfig = {
        isolationColor: 'steelblue',
        isolationTextColor: 'black',
        labResultColor: 'darkred',
        labResultTextColor: 'white',
        dateOfOnsetColor: 'white',
        dateOfOnsetTextColor: 'black',
        // opacity for cells that are before date of onset
        beforeDateOfOnsetOpacity: 0.35
    };

    // data used to draw the graph
    private graphData: TransmissionChainBarsModel;
    // graph container
    private graphContainer: any;
    // child container for the dates
    private graphDatesContainer: any;
    // child container for the cases
    private graphCasesContainer: any;

    // dates map to know the row # of each day date
    private datesMap = {};
    // cases map (by uid) to know the column index of each case
    private caseColumnMap = {};
    // current column index where a new case will be drawn
    private currentColumnIdx = 0;
    // keep the relations that were already drawn, to avoid duplicates
    //      this.drawnRelations[sourceCaseId][targetCaseId] = true
    private drawnRelations = {};

    // cache some translations
    private translationsMap = {};

    constructor(
        private i18nService: I18nService,
        private router: Router
    ) {
    }

    drawGraph(containerNative: any, data: any) {
        // clear current graph before redrawing
        d3.select(containerNative).selectAll('*').remove();

        // reset graph data
        this.datesMap = {};
        this.caseColumnMap = {};
        this.currentColumnIdx = 0;
        this.drawnRelations = {};

        // cache graph data
        this.graphData = data;

        // collect the dates to be displayed on the graph (Oy axis)
        this.collectDates();

        // set graph container height (keep extra 30px for horizontal scrollbar)
        const graphHeight = this.determineGraphHeight() + 30;
        containerNative.style.height = `${graphHeight}px`;

        // create graph d3 container
        this.graphContainer = d3.select(containerNative);

        // draw the dates column
        this.drawDates();

        // draw the cases
        this.drawCases();
    }

    /**
     * Collect and cache the dates to be displayed on the graph (Oy axis)
     */
    private collectDates() {
        const dayDates = this.getDaysBetween(this.graphData.minGraphDate, this.graphData.maxGraphDate);
        dayDates.forEach((date, index) => {
            this.datesMap[date] = index;
        });
    }

    /**
     * Draw the first column (with all the dates in the graph)
     */
    private drawDates() {
        // create dates container
        this.graphDatesContainer = this.graphContainer.append('div')
            .classed('dates-container', true);

        // create SVG container
        this.graphDatesContainer = this.graphDatesContainer.append('svg')
            .attr('width', this.dateCellWidth)
            .attr('height', '100%');

        // draw the first cell (placeholder for visual IDs and full names rows)
        this.graphDatesContainer.append('rect')
            .attr('fill', 'transparent')
            .attr('width', this.dateCellWidth)
            .attr('height', this.caseDetailsCellHeight);

        // draw each date
        Object.keys(this.datesMap).forEach((dayDate, index) => {
            // set position (top-left corner)
            const dateContainer = this.graphDatesContainer.append('svg')
                .attr('x', 0)
                .attr('y', this.caseDetailsCellHeight + index * this.cellHeight);

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
     * Draw the cases (one column for each case)
     */
    private drawCases() {
        // determine graph width based on the number of cases
        // cases-no * (margin-between-cases + case-cell-width) + placeholder-for-overflowing-name-or-visual-id
        const casesGraphWidth = this.graphData.casesOrder.length * (this.marginBetween + this.cellWidth) + 20;

        // create cases container
        this.graphCasesContainer = this.graphContainer.append('div')
            .classed('cases-container', true);

        // create SVG container
        this.graphCasesContainer = this.graphCasesContainer.append('svg')
            .attr('width', casesGraphWidth)
            .attr('height', this.determineGraphHeight());

        // draw each case column
        this.graphData.casesOrder.forEach((caseId) => {
            // did we already draw this case?
            if (this.caseColumnMap[caseId] === undefined) {
                this.drawCase(caseId);
            }
        });
    }

    /**
     * Draw a case block
     */
    private drawCase(caseId) {
        // keep case data for later use
        const caseData = this.graphData.casesMap[caseId] as CaseBarModel;
        // keep date of onset for later use
        const dateOfOnsetMoment = moment(caseData.dateOfOnset);
        const dateOfOnset = dateOfOnsetMoment.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);

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
        const caseColumnContainer = this.graphCasesContainer.append('svg')
            .attr('x', caseColumnIdx * (this.marginBetween + this.cellWidth))
            .attr('y', 0);

        // draw the case details cell
        const caseDetailsGroup = caseColumnContainer.append('g')
            .attr('transform', `translate(-6 0) rotate(-54, ${this.cellWidth / 2}, ${this.caseDetailsCellHeight / 2})`)
            .attr('class', 'case-info-header');
        // case full name
        caseDetailsGroup.append('text')
            .text(`${caseData.firstName} ${caseData.lastName}`)
            .attr('fill', 'black')
            .attr('font-size', '12px')
            .attr('alignment-baseline', 'central')
            // center the text vertically
            .attr('y', this.caseDetailsCellHeight / 2);
        // case visual ID
        caseDetailsGroup.append('text')
            .text(caseData.visualId)
            // .attr('class', 'case-info-header')
            .attr('fill', 'black')
            .attr('font-size', '12px')
            .attr('alignment-baseline', 'central')
            // center the text vertically and add extra 15px to display it on the next row
            .attr('y', this.caseDetailsCellHeight / 2 + 15);

        // register onclick event to navigate to case page when user clicks on Visual ID or Full Name
        const redirectToCasePage = (targetCaseId: string) => {
            this.router.navigate(['cases', targetCaseId, 'view']);
        };
        caseDetailsGroup.on('click', () => { redirectToCasePage(caseData.id); });

        /**
         * draw the case isolation cells
         */
        (caseData.dateRanges || []).forEach((isolation) => {
            const isolationDates = this.getDaysBetween(isolation.startDate, isolation.endDate);
            let isolationLabel = this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_ISOLATED_CASE_LABEL');
            if (isolation.typeId === 'LNG_REFERENCE_DATA_CATEGORY_PERSON_DATE_TYPE_HOSPITALIZATION') {
                isolationLabel = this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_HOSPITALISED_CASE_LABEL');
            } else if (isolation.typeId === 'LNG_REFERENCE_DATA_CATEGORY_PERSON_DATE_TYPE_HOSPITALIZATION_FOR_OTHER_MEDICAL_CONDITIONS') {
                isolationLabel = this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_HOSPITALISED_FOR_OTHER_CONDITIONS_CASE_LABEL');
            }

            // draw a cell for each isolation date
            isolationDates.forEach((isolationDate) => {
                // check if date is before date of onset
                const opacity = (moment(isolationDate).isBefore(dateOfOnsetMoment)) ? this.graphConfig.beforeDateOfOnsetOpacity : 1;

                const isolationGroup = caseColumnContainer.append('g')
                    .attr('transform', `translate(0, ${this.caseDetailsCellHeight + (this.datesMap[isolationDate] * this.cellHeight)})`);
                isolationGroup.append('rect')
                    .attr('width', this.cellWidth)
                    .attr('height', this.cellHeight)
                    .attr('fill', this.graphConfig.isolationColor)
                    .attr('fill-opacity', opacity);
                isolationGroup.append('text')
                    .text(isolationLabel)
                    .attr('fill', this.graphConfig.isolationTextColor)
                    .attr('fill-opacity', opacity)
                    .attr('alignment-baseline', 'central')
                    .attr('text-anchor', 'middle')
                    // center the text
                    .attr('x', this.cellWidth / 2)
                    .attr('y', this.cellHeight / 2);
            });
        });

        /**
         * draw the lab results cells
         */
        (caseData.labResults || []).forEach((labResult) => {
            let result = this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_LAB_RESULT_UNKNOWN_LABEL');
            if (labResult.result === 'LNG_REFERENCE_DATA_CATEGORY_LAB_TEST_RESULT_POSITIVE') {
                result = this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_LAB_RESULT_POSITIVE_LABEL');
            } else if (labResult.result === 'LNG_REFERENCE_DATA_CATEGORY_LAB_TEST_RESULT_NEGATIVE') {
                result = this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_LAB_RESULT_NEGATIVE_LABEL');
            }

            const labResultDate = moment(labResult.dateSampleTaken).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);

            // check if date is before date of onset
            const opacity = (moment(labResultDate).isBefore(dateOfOnsetMoment)) ? this.graphConfig.beforeDateOfOnsetOpacity : 1;

            const labResultGroup = caseColumnContainer.append('g')
                .attr('transform', `translate(0, ${this.caseDetailsCellHeight + (this.datesMap[labResultDate] * this.cellHeight)})`);
            labResultGroup.append('rect')
                .attr('width', this.cellWidth)
                .attr('height', this.cellHeight)
                .attr('fill', this.graphConfig.labResultColor)
                .attr('fill-opacity', opacity);
            labResultGroup.append('text')
                .text(result)
                .attr('fill', this.graphConfig.labResultTextColor)
                .attr('alignment-baseline', 'central')
                .attr('text-anchor', 'middle')
                // center the text
                .attr('x', this.cellWidth / 2)
                .attr('y', this.cellHeight / 2);
        });

        /**
         * draw the date of onset cell
         */
        const dateOfOnsetLabel = this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_CASE_ONSET_LABEL');
        const dateOfOnsetGroup = caseColumnContainer.append('g')
            .attr('transform', `translate(0, ${this.caseDetailsCellHeight + (this.datesMap[dateOfOnset] * this.cellHeight)})`);
        dateOfOnsetGroup.append('rect')
            .attr('width', this.cellWidth)
            .attr('height', this.cellHeight)
            .attr('fill', this.graphConfig.dateOfOnsetColor);
        dateOfOnsetGroup.append('text')
            .text(dateOfOnsetLabel)
            .attr('fill', this.graphConfig.dateOfOnsetTextColor)
            .attr('alignment-baseline', 'central')
            .attr('text-anchor', 'middle')
            // center the text
            .attr('x', this.cellWidth / 2)
            .attr('y', this.cellHeight / 2);

        // draw the case bar container (to show the border)
        const caseBar = caseColumnContainer.append('svg')
            .attr('class', 'case-bar')
            .attr('x', 0)
            .attr('y', this.caseDetailsCellHeight + (this.datesMap[dateOfOnset] * this.cellHeight));
        caseBar.append('rect')
            .attr('width', this.cellWidth)
            .attr('height', (moment(caseData.lastGraphDate).diff(dateOfOnsetMoment, 'days') + 1) * this.cellHeight)
            .attr('fill', 'transparent')
            .attr('stroke', 'black')
            .attr('stroke-width', '1')
            // .attr('shape-rendering', 'crispEdges');
            .attr('shape-rendering', 'optimizeQuality');

        /**
         * Show relationships with different color when hover on a Case
         */
        caseBar.on('click', () => {
            // selected case does already have accent?
            if (caseBar.classed('accent')) {
                // selected case has accent;
                // remove accent from case
                caseBar.classed('accent', false);
                // remove accent from all relationships
                this.graphCasesContainer.selectAll('.relationship')
                    .classed('accent', false);
            } else {
                // selected case doesn't have accent;
                // remove accent from all elements
                this.graphCasesContainer.selectAll('.accent')
                    .classed('accent', false);

                // add accent to case
                caseBar.classed('accent', true);
                // add accent to relationships
                const sourceCaseRelationships = this.graphCasesContainer
                    // find the relationships where current case is source
                    .selectAll(`.source-case-${caseData.id}`)
                    // show relationships with accent color
                    .classed('accent', true)
                    // remove them temporarily
                    .remove();

                // add them back (so they are rendered on top of the others)
                _.get(sourceCaseRelationships, '_groups[0]', []).forEach((relationshipElem) => {
                    this.graphCasesContainer.append(() => relationshipElem);
                });
            }
        });

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
        const sourceCaseData = this.graphData.casesMap[sourceCaseId];
        const targetCaseData = this.graphData.casesMap[targetCaseId];

        if (
            !_.isNumber(sourceCaseColumnIdx) ||
            !_.isNumber(targetCaseColumnIdx) ||
            !sourceCaseData ||
            !targetCaseData
        ) {
            return;
        }

        const sourceCaseFirstGraphDate = moment(sourceCaseData.dateOfOnset).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
        const targetCaseFirstGraphDate = moment(targetCaseData.dateOfOnset).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);

        // mark the relation as being drawn, to avoid duplicates
        _.set(this.drawnRelations, `[${sourceCaseId}][${targetCaseId}]`, true);

        // start from the vertical middle of the top cell from source case's bar
        // left or right?
        const leftOrRight = (sourceCaseColumnIdx < targetCaseColumnIdx) ? 1 : 0;
        const lineStartX = (sourceCaseColumnIdx * (this.marginBetween + this.cellWidth)) + (leftOrRight * this.cellWidth);
        const lineStartY = this.caseDetailsCellHeight + (this.datesMap[sourceCaseFirstGraphDate] * this.cellHeight) + (this.cellHeight / 2);
        // stop at the horizontal middle of the target case's bar
        const lineEndX = (targetCaseColumnIdx * (this.marginBetween + this.cellWidth)) + (this.cellWidth / 2);
        const lineEndY = lineStartY;
        // draw the arrow at the horizontal middle of the target case's bar, but touching the bar
        const arrowX = lineEndX;
        const arrowY = this.caseDetailsCellHeight + (this.datesMap[targetCaseFirstGraphDate] * this.cellHeight);

        // draw the horizontal line from the source case to the target case
        this.graphCasesContainer.append('line')
            .attr('class', `relationship source-case-${sourceCaseId}`)
            .attr('stroke', 'black')
            .attr('stroke-width', '1px')
            .attr('x1', lineStartX)
            .attr('y1', lineStartY)
            .attr('x2', lineEndX)
            .attr('y2', lineEndY);

        // draw the vertical line (arrow's base)
        this.graphCasesContainer.append('line')
            .attr('class', `relationship source-case-${sourceCaseId}`)
            .attr('stroke', 'black')
            .attr('stroke-width', '1px')
            .attr('x1', lineEndX)
            .attr('y1', lineEndY)
            .attr('x2', arrowX)
            .attr('y2', arrowY);

        // draw the top of the arrow
        this.graphCasesContainer.append('polygon')
            .attr('class', `relationship source-case-${sourceCaseId}`)
            .attr('fill', 'black')
            .attr('points', `${arrowX},${arrowY} ${arrowX - 5},${(arrowY - 8)} ${arrowX + 5},${arrowY - 8}`);
    }

    /**
     * Determine graph height based on the data
     */
    private determineGraphHeight(): number {
        const daysNo = Object.keys(this.datesMap).length;

        // visual-id-column-height + days-no * cell-height
        return this.caseDetailsCellHeight + daysNo * this.cellHeight;
    }

    /**
     * Get the list of days of a period
     */
    private getDaysBetween(startDate: string, endDate: string): string[] {
        // start from the start date and increment it
        const dateMoment = moment(startDate);
        const endDateMoment = moment(endDate);

        const days = [];
        while (!dateMoment.isAfter(endDateMoment)) {
            // get date in proper format
            const dayDate = dateMoment.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
            // update list
            days.push(dayDate);
            // increment date with 1 day
            dateMoment.add(1, 'days');
        }

        return days;
    }

    /**
     * Translate token and cache it
     */
    private translate(token: string): string {
        if (!this.translationsMap[token]) {
            this.translationsMap[token] = this.i18nService.instant(token);
        }

        return this.translationsMap[token];
    }
}
