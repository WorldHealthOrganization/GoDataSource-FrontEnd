import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import * as moment from 'moment';
import * as _ from 'lodash';
import { Constants } from '../../../core/models/constants';
import { TransmissionChainBarsModel } from '../typings/transmission-chain-bars.model';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { EntityBarModel } from '../typings/entity-bar.model';
import { Router } from '@angular/router';
import { EntityType } from '../../../core/models/entity-type';

@Injectable()
export class TransmissionChainBarsService {
    // regular cell width
    private cellWidth = 50;
    // regular cell height
    private cellHeight = 25;
    // space between cases / events
    private marginBetween = 7;
    // date cell width (first column)
    private dateCellWidth = 120;
    // case / event details cell height (first row)
    private entityDetailsCellHeight = 100;

    // keeping this config centralized in case / event we need to make the graph configurable by the user
    private graphConfig = {
        isolationColor: 'steelblue',
        isolationTextColor: 'black',
        labResultColor: 'darkred',
        labResultTextColor: 'white',
        dateColor: 'white',
        dateTextColor: 'black',
        // opacity for cells that are before date of onset
        beforeDateOfOnsetOpacity: 0.35
    };

    // data used to draw the graph
    private graphData: TransmissionChainBarsModel;
    // graph container
    private graphContainer: any;
    // child container for the dates
    private graphDatesContainer: any;
    // child container for the cases / events
    private graphEntityContainer: any;

    // dates map to know the row # of each day date
    private datesMap = {};
    // cases / events map (by uid) to know the column index of each case / event
    private entityColumnMap = {};
    // current column index where a new case / event will be drawn
    private currentColumnIdx = 0;
    // keep the relations that were already drawn, to avoid duplicates
    //      this.drawnRelations[sourceEntityId][targetEntityId] = true
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
        this.entityColumnMap = {};
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

        // draw the cases / events
        this.drawEntities();
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
            .attr('height', this.entityDetailsCellHeight);

        // draw each date
        Object.keys(this.datesMap).forEach((dayDate, index) => {
            // set position (top-left corner)
            const dateContainer = this.graphDatesContainer.append('svg')
                .attr('x', 0)
                .attr('y', this.entityDetailsCellHeight + index * this.cellHeight);

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
     * Draw the cases & events (one column for each case / event)
     */
    private drawEntities() {
        // determine graph width based on the number of cases & events
        // entities-no * (margin-between-entities + entity-cell-width) + placeholder-for-overflowing-name-or-visual-id
        const entitiesGraphWidth = this.graphData.personsOrder.length * (this.marginBetween + this.cellWidth) + 20;

        // create entities container
        this.graphEntityContainer = this.graphContainer.append('div')
            .classed('entities-container', true);

        // create SVG container
        this.graphEntityContainer = this.graphEntityContainer.append('svg')
            .attr('width', entitiesGraphWidth)
            .attr('height', this.determineGraphHeight());

        // draw each case / event column
        this.graphData.personsOrder.forEach((entityId) => {
            // did we already draw this case / event?
            if (this.entityColumnMap[entityId] === undefined) {
                this.drawEntity(entityId);
            }
        });
    }

    /**
     * Draw a case / event block
     */
    private drawEntity(entityId) {
        // keep case / event data for later use
        const entityData = this.graphData.personsMap[entityId] as EntityBarModel;
        if (!entityData) {
            return;
        }

        // keep case date of onset / event date for later use
        const dateMoment = moment(entityData.date);
        const date = dateMoment.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);

        // the column where we draw the case / event
        const entityColumnIdx = this.currentColumnIdx;

        // increment the current column index for when drawing a new case / event
        this.currentColumnIdx++;

        // add case / event to the map, so we know it's (already) drawn
        this.entityColumnMap[entityData.id] = entityColumnIdx;

        // draw the case / event column container
        const entityColumnContainer = this.graphEntityContainer.append('svg')
            .attr('x', entityColumnIdx * (this.marginBetween + this.cellWidth))
            .attr('y', 0);

        // draw the case / event details cell
        const entityDetailsGroup = entityColumnContainer.append('g')
            .attr('transform', `translate(-6 0) rotate(-54, ${this.cellWidth / 2}, ${this.entityDetailsCellHeight / 2})`)
            .attr('class', 'entity-info-header');

        // case full name / / event name
        const name: string = (entityData.firstName ? entityData.firstName + ' ' : '') +
            (entityData.lastName ? entityData.lastName : '');
        entityDetailsGroup.append('text')
            .text(name)
            .attr('fill', 'black')
            .attr('font-size', '12px')
            .attr('alignment-baseline', 'central')
            // center the text vertically
            .attr('y', this.entityDetailsCellHeight / 2);

        // case visual ID
        entityDetailsGroup.append('text')
            .text(entityData.visualId)
            // .attr('class', 'entity-info-header')
            .attr('fill', 'black')
            .attr('font-size', '12px')
            .attr('alignment-baseline', 'central')
            // center the text vertically and add extra 15px to display it on the next row
            .attr('y', this.entityDetailsCellHeight / 2 + 15);

        // register onclick event to navigate to case page when user clicks on Visual ID or Full Name
        const redirectToEntityPage = (targetEntityId: string, entityType: EntityType) => {
            if (entityType === EntityType.EVENT) {
                this.router.navigate(['events', targetEntityId, 'view']);
            } else {
                this.router.navigate(['cases', targetEntityId, 'view']);
            }
        };
        entityDetailsGroup.on('click', () => { redirectToEntityPage(entityData.id, entityData.type); });

        /**
         * draw the case isolation cells
         */
        (entityData.dateRanges || []).forEach((isolation) => {
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
                const opacity = (moment(isolationDate).isBefore(dateMoment)) ? this.graphConfig.beforeDateOfOnsetOpacity : 1;

                const isolationGroup = entityColumnContainer.append('g')
                    .attr('transform', `translate(0, ${this.entityDetailsCellHeight + (this.datesMap[isolationDate] * this.cellHeight)})`);
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
        (entityData.labResults || []).forEach((labResult) => {
            let result = this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_LAB_RESULT_UNKNOWN_LABEL');
            if (labResult.result === 'LNG_REFERENCE_DATA_CATEGORY_LAB_TEST_RESULT_POSITIVE') {
                result = this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_LAB_RESULT_POSITIVE_LABEL');
            } else if (labResult.result === 'LNG_REFERENCE_DATA_CATEGORY_LAB_TEST_RESULT_NEGATIVE') {
                result = this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_LAB_RESULT_NEGATIVE_LABEL');
            }

            const labResultDate = moment(labResult.dateSampleTaken).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);

            // check if date is before date of onset
            const opacity = (moment(labResultDate).isBefore(dateMoment)) ? this.graphConfig.beforeDateOfOnsetOpacity : 1;

            const labResultGroup = entityColumnContainer.append('g')
                .attr('transform', `translate(0, ${this.entityDetailsCellHeight + (this.datesMap[labResultDate] * this.cellHeight)})`);
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
        const dateOfOnsetGroup = entityColumnContainer.append('g')
            .attr('transform', `translate(0, ${this.entityDetailsCellHeight + (this.datesMap[date] * this.cellHeight)})`);
        dateOfOnsetGroup.append('rect')
            .attr('width', this.cellWidth)
            .attr('height', this.cellHeight)
            .attr('fill', this.graphConfig.dateColor);
        dateOfOnsetGroup.append('text')
            .text(dateOfOnsetLabel)
            .attr('fill', this.graphConfig.dateTextColor)
            .attr('alignment-baseline', 'central')
            .attr('text-anchor', 'middle')
            // center the text
            .attr('x', this.cellWidth / 2)
            .attr('y', this.cellHeight / 2);

        // draw the case / event bar container (to show the border)
        const entityBar = entityColumnContainer.append('svg')
            .attr('class', 'entity-bar')
            .attr('x', 0)
            .attr('y', this.entityDetailsCellHeight + (this.datesMap[date] * this.cellHeight));
        entityBar.append('rect')
            .attr('width', this.cellWidth)
            .attr('height', (moment(entityData.lastGraphDate).diff(dateMoment, 'days') + 1) * this.cellHeight)
            .attr('fill', 'transparent')
            .attr('stroke', 'black')
            .attr('stroke-width', '1')
            // .attr('shape-rendering', 'crispEdges');
            .attr('shape-rendering', 'optimizeQuality');

        /**
         * Show relationships with different color when hover on a Case / Event
         */
        entityBar.on('click', () => {
            // selected case / event does already have accent?
            if (entityBar.classed('accent')) {
                // selected case / event has accent;
                // remove accent from case / event
                entityBar.classed('accent', false);

                // remove accent from all relationships
                this.graphEntityContainer.selectAll('.relationship')
                    .classed('accent', false);
            } else {
                // selected case / event doesn't have accent;
                // remove accent from all elements
                this.graphEntityContainer.selectAll('.accent')
                    .classed('accent', false);

                // add accent to case / event
                entityBar.classed('accent', true);

                // add accent to relationships
                const sourceEntityRelationships = this.graphEntityContainer
                    // find the relationships where current case / event is source
                    .selectAll(`.source-entity-${entityData.id}`)
                    // show relationships with accent color
                    .classed('accent', true)
                    // remove them temporarily
                    .remove();

                // add them back (so they are rendered on top of the others)
                _.get(sourceEntityRelationships, '_groups[0]', []).forEach((relationshipElem) => {
                    this.graphEntityContainer.append(() => relationshipElem);
                });
            }
        });

        // draw case's / event's relations
        if (this.graphData.relationships[entityData.id]) {
            this.graphData.relationships[entityData.id].forEach((targetEntityId) => {
                // need to draw the target case / event?
                if (this.entityColumnMap[targetEntityId] === undefined) {
                    this.drawEntity(targetEntityId);
                }

                // need to draw the relationship?
                if (
                    !this.drawnRelations[entityData.id] ||
                    !this.drawnRelations[entityData.id][targetEntityId]
                ) {
                    this.drawRelationship(entityData.id, targetEntityId);
                }
            });
        }
    }

    /**
     * Draw a relationship between two cases / events
     */
    private drawRelationship(sourceEntityId, targetEntityId) {
        // get source and target cases column indexes
        const sourceEntityColumnIdx = this.entityColumnMap[sourceEntityId];
        const targetEntityColumnIdx = this.entityColumnMap[targetEntityId];

        // get source and target case's / event's data
        const sourceEntityData = this.graphData.personsMap[sourceEntityId];
        const targetEntityData = this.graphData.personsMap[targetEntityId];

        if (
            !_.isNumber(sourceEntityColumnIdx) ||
            !_.isNumber(targetEntityColumnIdx) ||
            !sourceEntityData ||
            !targetEntityData
        ) {
            return;
        }

        const sourceEntityFirstGraphDate = moment(sourceEntityData.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
        const targetEntityFirstGraphDate = moment(targetEntityData.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);

        // mark the relation as being drawn, to avoid duplicates
        _.set(this.drawnRelations, `[${sourceEntityId}][${targetEntityId}]`, true);

        // start from the vertical middle of the top cell from source case's / event's bar
        // left or right?
        const leftOrRight = (sourceEntityColumnIdx < targetEntityColumnIdx) ? 1 : 0;
        const lineStartX = (sourceEntityColumnIdx * (this.marginBetween + this.cellWidth)) + (leftOrRight * this.cellWidth);
        const lineStartY = this.entityDetailsCellHeight + (this.datesMap[sourceEntityFirstGraphDate] * this.cellHeight) + (this.cellHeight / 2);
        // stop at the horizontal middle of the target case's / event's bar
        const lineEndX = (targetEntityColumnIdx * (this.marginBetween + this.cellWidth)) + (this.cellWidth / 2);
        const lineEndY = lineStartY;
        // draw the arrow at the horizontal middle of the target case's / event's bar, but touching the bar
        const arrowX = lineEndX;
        const arrowY = this.entityDetailsCellHeight + (this.datesMap[targetEntityFirstGraphDate] * this.cellHeight);

        // draw the horizontal line from the source case / event to the target case / event
        this.graphEntityContainer.append('line')
            .attr('class', `relationship source-entity-${sourceEntityId}`)
            .attr('stroke', 'black')
            .attr('stroke-width', '1px')
            .attr('x1', lineStartX)
            .attr('y1', lineStartY)
            .attr('x2', lineEndX)
            .attr('y2', lineEndY);

        // draw the vertical line (arrow's base)
        this.graphEntityContainer.append('line')
            .attr('class', `relationship source-entity-${sourceEntityId}`)
            .attr('stroke', 'black')
            .attr('stroke-width', '1px')
            .attr('x1', lineEndX)
            .attr('y1', lineEndY)
            .attr('x2', arrowX)
            .attr('y2', arrowY);

        // draw the top of the arrow
        this.graphEntityContainer.append('polygon')
            .attr('class', `relationship source-entity-${sourceEntityId}`)
            .attr('fill', 'black')
            .attr('points', `${arrowX},${arrowY} ${arrowX - 5},${(arrowY - 8)} ${arrowX + 5},${arrowY - 8}`);
    }

    /**
     * Determine graph height based on the data
     */
    private determineGraphHeight(): number {
        const daysNo = Object.keys(this.datesMap).length;

        // visual-id-column-height + days-no * cell-height
        return this.entityDetailsCellHeight + daysNo * this.cellHeight;
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
