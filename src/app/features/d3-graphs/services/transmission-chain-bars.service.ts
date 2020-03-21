import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import * as _ from 'lodash';
import { Constants } from '../../../core/models/constants';
import { TransmissionChainBarsModel } from '../typings/transmission-chain-bars.model';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { EntityBarModel } from '../typings/entity-bar.model';
import { Router } from '@angular/router';
import { EntityType } from '../../../core/models/entity-type';
import { Moment, moment } from '../../../core/helperClasses/x-moment';
import { v4 as uuid } from 'uuid';

// define cell types that we need to draw
enum drawCellType {
    CASE_ISO_HSP,
    LAB_RESULT,
    DATE_OF_ONSET,
    DATE_OF_OUTCOME,
    DATE_OF_BURIAL
}

// define cells that we need to draw
class DrawCell {
    // props
    type: drawCellType;
    date: string;
    label: string;
    opacity: number;
    centerName: string;

    // constructor
    constructor(data: {
        // required
        type: drawCellType,
        date: string,
        label: string,

        // optional
        centerName?: string
    }) {
        Object.assign(this, data);
    }
}

// used to draw lines
interface Line {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
}

// used to render center names
interface GroupCell {
    nameCompare: string;
    name: string;
    entityStartIndex: number;
    cells: number;
    bgColor: string;
    rect?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

@Injectable()
export class TransmissionChainBarsService {
    // regular cell width
    private readonly cellWidthDefault = 91;
    private cellWidth = this.cellWidthDefault;
    // regular cell height
    private cellHeight = 25;
    // space between cases / events
    private marginBetween = 10;
    // date cell width (first column)
    private dateCellWidth = 100;
    // case / event details cell height (first row)
    private entityDetailsCellHeight = 100;
    // relationship X margin - position of relationship vertical lines on X position related to cell left position
    private relationshipXMargin = 5;
    // cell left padding
    private cellXPadding = this.relationshipXMargin * 2;
    // extra graph height
    // - 30 for scrollbar (keep extra 30px for horizontal scrollbar)
    private graphExtraHeight = 30;
    // keep occupied space so we determine intersection
    private relationshipOccupiedSpaces: {
        yLines: {
            values: {
                [y: number]: Line[]
            },
            max: number
        },
        xLines: {
            values: {
                [x: number]: Line[]
            },
            max: number
        }
    } = {
        yLines: {
            values: {},
            max: 0
        },
        xLines: {
            values: {},
            max: 0
        }
    };
    // relationship line width
    private relationshipStrokeWidth: number = 1;
    // relationship spaces between lines
    private relationshipSpaceBetweenStrokesY: number = 3;
    private relationshipSpaceBetweenStrokesX: number = 8;

    // keeping this config centralized in case / event we need to make the graph configurable by the user
    public graphConfig = {
        isolationColor: 'steelblue',
        isolationTextColor: 'black',
        labResultColor: 'darkred',
        labResultTextColor: 'white',
        dateOnsetColor: 'white',
        dateOnsetTextColor: 'black',
        dateOutcomeColor: '#003d4d',
        dateOutcomeTextColor: 'white',
        dateOutcomeBurialColor: '#990000',
        dateOutcomeBurialTextColor: 'black',
        // opacity for cells that are before date of onset
        beforeDateOfOnsetOpacity: 0.35,
        relationshipStrokeColor: '#555555'
    };

    // data used to draw the graph
    private graphData: TransmissionChainBarsModel;
    // graph container
    private graphContainer: any;
    // child container for the dates
    private graphDatesContainer: any;
    // child container for the cases / events
    private graphEntityContainer: any;
    private graphEntityContainerDiv: any;
    // keep hover div to display information
    private graphHoverDiv: any;
    // native container
    private containerNative: any;

    // dates map to know the row # of each day date
    private datesMap = {};
    // cases / events map (by uid) to know the column index of each case / event
    private entityColumnMap = {};
    // current column index where a new case / event will be drawn
    private currentColumnIdx = 0;
    // keep the relations that were already drawn, to avoid duplicates
    //      this.drawnRelations[sourceEntityId][targetEntityId] = true
    private drawnRelations = {};
    private namesMap: string[] = [];

    // cache some translations
    private translationsMap = {};

    // window scroll listener
    private onWindowScrollArrow: any;

    // center name group line height
    private entityDetailsTextLineCellHeight: number = 24;
    private entityDetailsTextLineSpaceBetween: number = 5;
    private entityDetailsTextLinesHeight: number;
    private entityDetailsTextLinesHeightMarginBottom: number = 10;
    private entityDetailsTextLinesColorMargin: number = 4;
    private entityDetailsTextLinesColorWidth: number = 10;
    private centerNameCellHeight: number = 5;
    // grouped center names
    private centerNameCells: GroupCell[] = [];
    // mapped entity center name cells
    private entityToCenterNameCell: {
        [entityId: string]: {
            [centerName: string]: GroupCell
        }
    } = {};
    // center name colors
    private centerNameColors: string[] = [
        '#cc00ff',
        '#00cc00',
        '#669999',
        '#ff6600',
        '#ccff99',
        '#333300',
        '#663300'
    ];

    // relations that we couldn't draw along with parent..so we need to draw them later
    // because target entity is missing
    private remainingRelationsToDraw: {
        [targetId: string]: string[]
    } = {};

    // keep last occupying group lines elements to easily determine position on which we should draw...
    private centerOccupiedLines: {
        [y: number]: {
            x1: number,
            x2: number
        }
    } = {};

    // Map of center token names
    private centerTokenToNameMap: {
        [token: string]: string
    } = {};

    /**
     * Constructor
     */
    constructor(
        private i18nService: I18nService,
        private router: Router
    ) {}

    /**
     * Draw graph
     * @param containerNative
     * @param data
     * @param options
     */
    drawGraph(
        containerNative: any,
        data: TransmissionChainBarsModel,
        centerTokenToNameMap: {
            [token: string]: string
        } = {},
        options?: {
            cellWidth?: number
        }
    ) {
        // center translations
        this.centerTokenToNameMap = centerTokenToNameMap;

        // keep container native
        this.containerNative = containerNative;

        // change cell width ?
        const cellWidth = _.get(options, 'cellWidth');
        this.cellWidth = cellWidth ? cellWidth : this.cellWidthDefault;

        // clear current graph before redrawing
        d3.select(containerNative).selectAll('*').remove();

        // reset graph data
        this.datesMap = {};
        this.entityColumnMap = {};
        this.currentColumnIdx = 0;
        this.drawnRelations = {};
        this.namesMap = [];

        // cache graph data
        this.graphData = data;

        // collect the dates to be displayed on the graph (Oy axis)
        this.collectDates();

        // create graph d3 container
        this.graphContainer = d3.select(containerNative);

        // Determine center name groups
        this.determineCenterNameGroups();

        // create hover div
        this.drawHoverDiv();

        // draw the dates column
        this.drawDates();

        // draw the cases / events
        this.remainingRelationsToDraw = {};
        this.centerOccupiedLines = {};
        this.drawEntities();

        // set graph container height
        const graphHeight = this.determineGraphHeight();
        containerNative.style.height = `${graphHeight}px`;
    }

    /**
     * Determine center name groups
     */
    private determineCenterNameGroups() {
        // determine center name groups cells
        const centerNameMapLastCells: {
            [nameCompare: string]: GroupCell
        } = {};
        this.centerNameCells = [];
        let colorIndex: number = 0;
        this.entityToCenterNameCell = {};
        this.graphData.personsOrder.forEach((entityId, entityIndex: number) => {
            const entityData: EntityBarModel = this.graphData.personsMap[entityId];
            entityData.centerNames.forEach((centerName: string) => {
                // init data for this center name
                const centerNameKey: string = this.centerNameToCompareValue(centerName);

                // check if we need to create a new cell or we can use the previous one
                if (
                    centerNameMapLastCells[centerNameKey] &&
                    centerNameMapLastCells[centerNameKey].entityStartIndex + centerNameMapLastCells[centerNameKey].cells >= entityIndex
                ) {
                    // extend the existing one
                    centerNameMapLastCells[centerNameKey].cells++;

                    // map entity to cell
                    if (!this.entityToCenterNameCell[entityId]) {
                        this.entityToCenterNameCell[entityId] = {};
                    }
                    this.entityToCenterNameCell[entityId][centerNameKey] = centerNameMapLastCells[centerNameKey];
                } else {
                    // create a new one
                    const newCenterNameCell: GroupCell = {
                        nameCompare: centerNameKey,
                        name: centerName,
                        entityStartIndex: entityIndex,
                        cells: 1,
                        bgColor: this.centerNameColors[colorIndex % this.centerNameColors.length]
                    };

                    // next color
                    colorIndex++;

                    // map cell so we can use it later
                    centerNameMapLastCells[newCenterNameCell.nameCompare] = newCenterNameCell;

                    // map entity to cell
                    if (!this.entityToCenterNameCell[entityId]) {
                        this.entityToCenterNameCell[entityId] = {};
                    }
                    this.entityToCenterNameCell[entityId][newCenterNameCell.nameCompare] = newCenterNameCell;

                    // add the new cell to the list of drawable cells
                    this.centerNameCells.push(newCenterNameCell);
                }
            });
        });

        // determine max number of lines used to render center names
        const centerLines: {
            [rowIndex: string]: number
        } = {};
        _.each(this.centerNameCells, (group: GroupCell) => {
            for (let rowIndex: number = group.entityStartIndex; rowIndex < group.entityStartIndex + group.cells; rowIndex++) {
                if (!centerLines[`_${rowIndex}`]) {
                    centerLines[`_${rowIndex}`] = 1;
                } else {
                    centerLines[`_${rowIndex}`]++;
                }
            }
        });

        // determine mex
        const centerNameMaxLines: number = _.isEmpty(centerLines) ? 0 : Math.max(...Object.values(centerLines));

        // add center name lines
        this.entityDetailsTextLinesHeight = centerNameMaxLines * (this.entityDetailsTextLineCellHeight + this.entityDetailsTextLineSpaceBetween) + this.entityDetailsTextLinesHeightMarginBottom;
    }

    /**
     * Remove hover div
     */
    private removeHoverDiv() {
        // remove previous
        this.graphHoverDiv = document.querySelector('div.chart-floating-message');
        if (this.graphHoverDiv) {
            this.graphHoverDiv.remove();
        }
    }

    /**
     * Cleanup for Window scroll
     */
    private removeWindowScrollListener() {
        if (this.onWindowScrollArrow) {
            window.removeEventListener('scroll', this.onWindowScrollArrow, true);
            this.onWindowScrollArrow = null;
        }
    }

    /**
     * Hover div used to display info
     */
    private drawHoverDiv() {
        // remove previous
        this.removeHoverDiv();

        // remove previous window scroll
        this.removeWindowScrollListener();

        // listen for window scroll
        this.onWindowScrollArrow = () => {
            this.hideHoverDiv();
        };
        window.addEventListener('scroll', this.onWindowScrollArrow, true);

        // create hover div
        this.graphHoverDiv = document.createElement('DIV');
        this.graphHoverDiv.className = 'chart-floating-message';
        this.containerNative.parentElement.appendChild(this.graphHoverDiv);

        // setup hover div
        this.graphHoverDiv = document.querySelector('div.chart-floating-message');
        this.graphHoverDiv.style.position = 'absolute';
        this.graphHoverDiv.style['z-index'] = 100000;
        this.graphHoverDiv.style['background-color'] = '#f0f0f5';
        this.graphHoverDiv.style.padding = '2px';
        this.graphHoverDiv.style.border = '1px solid #707075';
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
            .attr('height', this.entityDetailsCellHeight + this.entityDetailsTextLinesHeight);

        // draw each date
        Object.keys(this.datesMap).forEach((dayDate, index) => {
            // set position (top-left corner)
            const dateContainer = this.graphDatesContainer.append('svg')
                .attr('x', 0)
                .attr('y', this.entityDetailsCellHeight + this.entityDetailsTextLinesHeight + index * this.cellHeight);

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
     * Mouse move - hover div
     */
    private initSvgMouseMove() {
        const svg: any = document.querySelector('svg.graph-entities-container-svg');
        svg.addEventListener(
            'mouseleave',
            () => {
                this.hideHoverDiv();
            }
        );
        svg.addEventListener(
            'mousemove',
            (evt) => {
                // retrieve hover div
                if (!this.graphHoverDiv) {
                    return;
                }

                // hide div if we don't have anything to display
                this.hideHoverDiv();

                // is there a point in checking position ?
                if (evt.layerY <= this.entityDetailsCellHeight + this.entityDetailsTextLinesHeight) {
                    return;
                }

                // determine date
                const date: string = moment(this.graphData.minGraphDate)
                    .add(Math.floor((evt.layerY - (this.entityDetailsCellHeight + this.entityDetailsTextLinesHeight)) / this.cellHeight), 'days')
                    .format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);

                // if date not mapped, then there is no point in displaying it
                if (this.datesMap[date] === undefined) {
                    return;
                }

                // determine person name
                const nameIndex = Math.floor((evt.layerX + this.graphEntityContainerDiv.scrollLeft) / (this.marginBetween + this.cellWidth));
                if (!this.namesMap[nameIndex]) {
                    return;
                }

                // get person name
                const personName: string = this.namesMap[nameIndex];

                // show div
                this.graphHoverDiv.style.display = 'inline-block';

                // text displayed on hover
                let text: string = `${date}: ${personName}`;

                // determine entity id
                let entityId: string;
                _.each(
                    this.entityColumnMap,
                    (index: number, id: string) => {
                        if (index === nameIndex) {
                            // found id
                            entityId = id;

                            // stop each
                            return false;
                        }
                    }
                );

                // determine if we need to display center name as well
                if (entityId) {
                    const entityData: EntityBarModel = this.graphData.personsMap[entityId];
                    const dateMoment: Moment = moment(date);
                    if (entityData) {
                        // check date ranges
                        if (entityData.dateRanges) {
                            entityData.dateRanges.forEach((dateRange) => {
                                const centerName: string = dateRange.centerName ? dateRange.centerName.trim() : null;
                                if (
                                    centerName &&
                                    dateRange.startDate &&
                                    moment(dateRange.startDate).isSameOrBefore(dateMoment) && (
                                        !dateRange.endDate ||
                                        moment(dateRange.endDate).isSameOrAfter(dateMoment)
                                    )
                                ) {
                                    text += `<br />${this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_CENTER_NAME_LABEL', { name: centerName })}`;
                                }
                            });
                        }
                    }
                }

                // determine if we need to change position and text
                if (this.graphHoverDiv.innerHTML === text) {
                    return;
                }

                // determine parents position
                let parent = this.graphHoverDiv.parentElement;
                let totalOffsetTop: number = 0;
                let totalOffsetLeft: number = 0;
                let scrollOffsetY: number = 0;
                while (parent) {
                    totalOffsetTop += parent.offsetTop;
                    totalOffsetLeft += parent.offsetLeft;
                    scrollOffsetY += parent.scrollTop;
                    parent = parent.parentElement;
                }

                // add filters height if necessary
                const filtersDiv: any = document.querySelector('div.filters');
                if (
                    filtersDiv &&
                    filtersDiv.offsetHeight
                ) {
                    scrollOffsetY += filtersDiv.offsetHeight - 30;
                }

                // set floating div position
                this.graphHoverDiv.innerHTML = text;
                this.graphHoverDiv.style.left = `${evt.screenX - totalOffsetLeft}px`;
                this.graphHoverDiv.style.top = `${evt.screenY - totalOffsetTop + scrollOffsetY}px`;

                // check if outside the screen
                const boundingRect = this.graphHoverDiv.getBoundingClientRect();
                if (boundingRect.top + boundingRect.height > window.innerHeight) {
                    this.graphHoverDiv.style.top = `${scrollOffsetY + window.innerHeight - 20 - (boundingRect.height + totalOffsetTop)}px`;
                }
            },
            false
        );
    }

    /**
     * Draw the cases & events (one column for each case / event)
     */
    private drawEntities() {
        // determine graph width based on the number of cases & events
        // entities-no * (margin-between-entities + entity-cell-width) + placeholder-for-overflowing-name-or-visual-id
        const entitiesGraphWidth = this.graphData.personsOrder.length * (this.marginBetween + this.cellWidth) + 20;

        // reset occupied spaces
        this.relationshipOccupiedSpaces = {
            yLines: {
                values: {},
                max: 0
            },
            xLines: {
                values: {},
                max: 0
            }
        };

        // create entities container
        this.graphEntityContainer = this.graphContainer.append('div')
            .classed('entities-container', true);
        this.graphEntityContainerDiv = document.querySelector('div.entities-container');

        // create SVG container
        this.graphEntityContainer = this.graphEntityContainer.append('svg')
            .classed('graph-entities-container-svg', true)
            .attr('width', entitiesGraphWidth);

        // listen for hover mouse to show data & person
        this.initSvgMouseMove();

        // draw each case / event column
        this.graphData.personsOrder.forEach((entityId) => {
            // did we already draw this case / event?
            if (this.entityColumnMap[entityId] === undefined) {
                this.drawEntity(entityId);
            }
        });

        // draw center names
        this.drawGraphCenterNames();

        // set graph height
        this.graphEntityContainer
            .attr('height', this.determineGraphHeight());
    }

    /**
     * Draw a case / event block
     */
    private drawEntity(entityId: string) {
        // keep case / event data for later use
        const entityData = this.graphData.personsMap[entityId] as EntityBarModel;
        if (!entityData) {
            return;
        }

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
            .attr('transform', `translate(${this.cellWidth / 2 - 32} 10) rotate(-54, 32, ${this.entityDetailsCellHeight / 2})`)
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
        const visualId: string = entityData.visualId ? entityData.visualId.trim() : null;
        if (visualId) {
            entityDetailsGroup.append('text')
                .text(entityData.visualId)
                // .attr('class', 'entity-info-header')
                .attr('fill', 'black')
                .attr('font-size', '12px')
                .attr('alignment-baseline', 'central')
                // center the text vertically and add extra 15px to display it on the next row
                .attr('y', this.entityDetailsCellHeight / 2 + 15);
        }

        // add entity to list of mapped persons
        this.namesMap.push(
            visualId ?
                `${name} (${visualId})` :
                name
        );

        // register onclick event to navigate to case page when user clicks on Visual ID or Full Name
        const redirectToEntityPage = (targetEntityId: string, entityType: EntityType) => {
            if (entityType === EntityType.EVENT) {
                this.router.navigate(['events', targetEntityId, 'view']);
            } else {
                this.router.navigate(['cases', targetEntityId, 'view']);
            }
        };
        entityDetailsGroup.on('click', () => { redirectToEntityPage(entityData.id, entityData.type); });



        // keep case date of onset / event date for later use
        const dateMoment = moment(entityData.date).startOf('day');
        const date = dateMoment.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);

        // determine all cell that we need to draw
        const cells: DrawCell[] = [];

        // date of onset to cells that we need to draw
        const dateOfOnsetLabel = this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_CASE_ONSET_LABEL');
        cells.push(new DrawCell({
            type: drawCellType.DATE_OF_ONSET,
            date: moment(date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT),
            label: dateOfOnsetLabel
        }));

        // date of outcome
        if (
            entityData.dateOfOutcome &&
            entityData.outcomeId
        ) {
            // determine cell label
            let dateOfOutcomeLabel: string = this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_OUTCOME_OTHER_LABEL');
            switch (entityData.outcomeId) {
                case 'LNG_REFERENCE_DATA_CATEGORY_OUTCOME_ALIVE':
                    dateOfOutcomeLabel = this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_OUTCOME_ALIVE_LABEL');
                    break;
                case 'LNG_REFERENCE_DATA_CATEGORY_OUTCOME_DECEASED':
                    // label
                    dateOfOutcomeLabel = this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_OUTCOME_DECEASED_LABEL');

                    // add date of burial if we have one
                    if (entityData.dateOfBurial) {
                        // add cell
                        cells.push(new DrawCell({
                            type: drawCellType.DATE_OF_BURIAL,
                            date: moment(entityData.dateOfBurial).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT),
                            label: entityData.safeBurial ?
                                this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_OUTCOME_BURIAL_DATE_SAFE_LABEL') :
                                this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_OUTCOME_BURIAL_DATE_NOT_SAFE_LABEL')
                        }));
                    }

                    // finished
                    break;
                case 'LNG_REFERENCE_DATA_CATEGORY_OUTCOME_RECOVERED':
                    dateOfOutcomeLabel = this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_OUTCOME_RECOVERED_LABEL');
                    break;
            }

            // add cell
            cells.push(new DrawCell({
                type: drawCellType.DATE_OF_OUTCOME,
                date: moment(entityData.dateOfOutcome).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT),
                label: dateOfOutcomeLabel
            }));
        }

        // determine case isolation cells that we should draw
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
                cells.push(new DrawCell({
                    type: drawCellType.CASE_ISO_HSP,
                    date: moment(isolationDate).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT),
                    label: isolationLabel,
                    centerName: isolation.centerName
                }));
            });
        });

        // determine lab result cells that we should draw
        (entityData.labResults || []).forEach((labResult) => {
            // determine result caption
            let result = this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_LAB_RESULT_UNKNOWN_LABEL');
            if (labResult.result === 'LNG_REFERENCE_DATA_CATEGORY_LAB_TEST_RESULT_POSITIVE') {
                result = this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_LAB_RESULT_POSITIVE_LABEL');
            } else if (labResult.result === 'LNG_REFERENCE_DATA_CATEGORY_LAB_TEST_RESULT_NEGATIVE') {
                result = this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_LAB_RESULT_NEGATIVE_LABEL');
            }

            // use date of result if we have one, or fallback to dateSampleTaken
            let labResultDate: string;
            let labPending: boolean = false;
            if (labResult.dateOfResult) {
                labResultDate = moment(labResult.dateOfResult).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
            } else {
                labResultDate = moment(labResult.dateSampleTaken).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
                labPending = true;
            }

            // pending lab results message
            if (labPending) {
                result = this.translate(
                    'LNG_PAGE_TRANSMISSION_CHAIN_BARS_LAB_PENDING_LABEL', {
                        result: result
                    }
                );
            }

            // draw a cell for lab result
            cells.push(new DrawCell({
                type: drawCellType.LAB_RESULT,
                date: labResultDate,
                label: result
            }));
        });

        // group cells that we need to draw by date
        const groupedCells: {
            [date: string]: DrawCell[]
        } = _.groupBy(
            cells,
            'date'
        );

        // determine the cell content full  width
        const fullCellContentWidth: number = this.cellWidth - this.cellXPadding;

        // draw cells
        _.each(
            groupedCells,
            (drawCells: DrawCell[]) => {
                // determine cell width
                const width: number = fullCellContentWidth / drawCells.length;

                // determine if we need to clip text
                const clipText: boolean = drawCells.length > 1;

                // draw each cell
                _.each(
                    drawCells,
                    (drawCell: DrawCell, cellIndex: number) => {
                        // determine type specific properties
                        let rectFillColor;
                        let rectTextColor;
                        switch (drawCell.type) {
                            case drawCellType.CASE_ISO_HSP:
                                rectTextColor = this.graphConfig.isolationTextColor;
                                rectFillColor = this.graphConfig.isolationColor;
                                break;
                            case drawCellType.LAB_RESULT:
                                rectTextColor = this.graphConfig.labResultTextColor;
                                rectFillColor = this.graphConfig.labResultColor;
                                break;
                            case drawCellType.DATE_OF_ONSET:
                                rectTextColor = this.graphConfig.dateOnsetTextColor;
                                rectFillColor = this.graphConfig.dateOnsetColor;
                                break;
                            case drawCellType.DATE_OF_OUTCOME:
                                rectTextColor = this.graphConfig.dateOutcomeTextColor;
                                rectFillColor = this.graphConfig.dateOutcomeColor;
                                break;
                            case drawCellType.DATE_OF_BURIAL:
                                rectTextColor = this.graphConfig.dateOutcomeBurialTextColor;
                                rectFillColor = this.graphConfig.dateOutcomeBurialColor;
                                break;
                        }

                        // position cell
                        const x: number = (cellIndex < 1 ? 0 : this.cellXPadding) + (width * cellIndex);
                        const y: number = this.entityDetailsCellHeight + this.entityDetailsTextLinesHeight + (this.datesMap[drawCell.date] * this.cellHeight);
                        const group = entityColumnContainer.append('g')
                            .attr(
                                'transform',
                                `translate(${x}, ${y})`
                            );

                        // check if date is before date of onset
                        const opacity = moment(drawCell.date).isBefore(dateMoment) ?
                            this.graphConfig.beforeDateOfOnsetOpacity :
                            1;

                        // draw cell rectangle
                        let rectWidth: number = (cellIndex + 1) < drawCells.length ? Math.ceil(width) : width;
                        rectWidth = cellIndex < 1 ? rectWidth + this.cellXPadding : rectWidth;
                        const rect = group.append('rect')
                            .attr('width', rectWidth)
                            .attr('height', this.cellHeight)
                            .attr('fill', rectFillColor);

                        // fill opacity
                        if (drawCell.type !== drawCellType.DATE_OF_ONSET) {
                            rect.attr('fill-opacity', opacity);
                        }

                        // add clip path to clip text ( hide overflow text )
                        const pathId: string = `clipPath${uuid()}`;
                        if (clipText) {
                            group.append('clipPath')
                                .attr('id', pathId)
                                .append('rect')
                                .attr('width', rectWidth)
                                .attr('height', this.cellHeight);
                        }

                        // draw cell text
                        const text = group.append('text')
                            .text(drawCell.label);

                        // clip text ?
                        if (clipText) {
                            text.attr('clip-path', `url(#${pathId})`);
                        }

                        // set text color
                        text.attr('fill', rectTextColor);

                        // fill opacity
                        if (drawCell.type !== drawCellType.DATE_OF_ONSET) {
                            text.attr('fill-opacity', opacity);
                        }

                        // continue with text data;
                        let textX: number = width / 2;
                        textX = cellIndex < 1 ? textX + this.cellXPadding : textX;
                        text
                            .attr('alignment-baseline', 'central')
                            .attr('text-anchor', 'middle')
                            // center the text
                            .attr('x', textX)
                            .attr('y', this.cellHeight / 2);

                        // render center name color
                        const centerNameKey: string = drawCell.centerName ? this.centerNameToCompareValue(drawCell.centerName) : null;
                        if (
                            centerNameKey &&
                            this.entityToCenterNameCell[entityId][centerNameKey]
                        ) {
                            // render rect
                            group.append('rect')
                                .attr('width', rectWidth)
                                .attr('height', this.centerNameCellHeight)
                                .attr('fill', this.entityToCenterNameCell[entityId][centerNameKey].bgColor)
                                .attr('fill-opacity', opacity);
                        }
                    }
                );
            }
        );

        // draw the case / event bar container (to show the border)
        const entityBar = entityColumnContainer.append('svg')
            .attr('class', 'entity-bar')
            .attr('x', 0)
            .attr('y', this.entityDetailsCellHeight + this.entityDetailsTextLinesHeight + (this.datesMap[date] * this.cellHeight));
        entityBar.append('rect')
            .attr('width', this.cellWidth)
            .attr('height', (moment(entityData.lastGraphDate).startOf('day').diff(dateMoment, 'days') + 1) * this.cellHeight)
            .attr('fill', 'transparent')
            .attr('stroke', 'black')
            .attr('stroke-width', '2')
            .attr('shape-rendering', 'optimizeSpeed');

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
                    // add relation to be drawn later...
                    if (!this.remainingRelationsToDraw[targetEntityId]) {
                        this.remainingRelationsToDraw[targetEntityId] = [];
                    }
                    this.remainingRelationsToDraw[targetEntityId].push(entityData.id);
                } else {
                    // need to draw the relationship?
                    if (
                        !this.drawnRelations[entityData.id] ||
                        !this.drawnRelations[entityData.id][targetEntityId]
                    ) {
                        this.drawRelationship(entityData.id, targetEntityId);
                    }
                }
            });
        }

        // draw remaining relations
        const targetId: string = entityData.id;
        if (this.remainingRelationsToDraw[targetId]) {
            this.remainingRelationsToDraw[targetId].forEach((sourceId: string) => {
                // need to draw the relationship?
                if (
                    !this.drawnRelations[sourceId] ||
                    !this.drawnRelations[sourceId][targetId]
                ) {
                    this.drawRelationship(sourceId, targetId);
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

        // determine line coordinates
        const leftOrRight = (sourceEntityColumnIdx < targetEntityColumnIdx) ? 1 : 0;
        const halfCellHeight = Math.round(this.cellHeight / 2);
        const lineInitialStartY = this.entityDetailsCellHeight + this.entityDetailsTextLinesHeight + (this.datesMap[sourceEntityFirstGraphDate] * this.cellHeight) + halfCellHeight;
        let lineStartY = lineInitialStartY;
        // stop at the horizontal of the target case's / event's bar
        let lineEndY = lineStartY;

        // x coordinates
        const initialLineStartX: number = (sourceEntityColumnIdx * (this.marginBetween + this.cellWidth)) + (leftOrRight * this.cellWidth);
        let lineStartX = initialLineStartX;
        const initialLineStartY: number = (targetEntityColumnIdx * (this.marginBetween + this.cellWidth)) + this.relationshipXMargin;
        let lineEndX = initialLineStartY;

        // determine if line intersects another relationship line
        const x1: number = lineStartX <= lineEndX ? lineStartX : lineEndX;
        const x2: number = lineStartX <= lineEndX ? lineEndX : lineStartX;
        while (
            this.relationshipOccupiedSpaces.yLines.values[lineStartY] !== undefined &&
            _.find(
                this.relationshipOccupiedSpaces.yLines.values[lineStartY],
                (yLine: Line) => {
                    return (x1 >= yLine.x1 && x1 <= yLine.x2) ||
                        (x2 >= yLine.x1 && x2 <= yLine.x2) ||
                        (yLine.x1 >= x1 && yLine.x1 <= x2) ||
                        (yLine.x2 >= x1 && yLine.x2 <= x2);
                }
            )
        ) {
            // try next one
            lineStartY += this.relationshipStrokeWidth + this.relationshipSpaceBetweenStrokesY;
            lineEndY = lineStartY;
        }

        // draw the arrow at the horizontal middle of the target case's / event's bar, but touching the bar
        const arrowY = this.entityDetailsCellHeight + this.entityDetailsTextLinesHeight + (this.datesMap[targetEntityFirstGraphDate] * this.cellHeight);

        // update x position if necessary
        // in some cases we might need to update y position after this one, but this case has few chances and until we encounter it there is no point to put more stress on performance
        const y1: number = arrowY <= lineEndY ? arrowY : lineEndY;
        const y2: number = arrowY <= lineEndY ? lineEndY : arrowY;
        while (
            this.relationshipOccupiedSpaces.xLines.values[lineEndX] !== undefined &&
            _.find(
                this.relationshipOccupiedSpaces.xLines.values[lineEndX],
                (xLine: Line) => {
                    return (y1 >= xLine.y1 && y1 <= xLine.y2) ||
                        (y2 >= xLine.y1 && y2 <= xLine.y2) ||
                        (xLine.y1 >= y1 && xLine.y1 <= y2) ||
                        (xLine.y2 >= y1 && xLine.y2 <= y2);
                }
            )
        ) {
            // try next one
            lineEndX += this.relationshipStrokeWidth + this.relationshipSpaceBetweenStrokesX;

            // if bigger then parent cell width, then we need to draw it on top...we can't draw it somewhere else...
            if (lineEndX > initialLineStartY + this.cellWidth - this.relationshipXMargin) {
                // reset position to the beg of the cell
                lineEndX = initialLineStartY;

                // we might want to extend this behaviour, to move it on Y when X is full..
                // #TODO

                // force break so we don't do an infinite while
                break;
            }
        }

        // draw connection lines ?
        if (lineStartY > lineInitialStartY) {
            // draw line a bit more on the right if needed
            let y: number = lineInitialStartY;
            if (
                lineStartY > lineInitialStartY + halfCellHeight &&
                lineStartX === initialLineStartX
            ) {
                lineStartX += this.relationshipXMargin;
                y = lineInitialStartY + halfCellHeight;
            }

            // draw connection line
            this.graphEntityContainer.append('line')
                .attr('class', `relationship source-entity-${sourceEntityId}`)
                .attr('stroke', this.graphConfig.relationshipStrokeColor)
                .attr('stroke-width', `${this.relationshipStrokeWidth}px`)
                .attr('x1', lineStartX)
                .attr('y1', y)
                .attr('x2', lineStartX)
                .attr('y2', lineEndY);
        }

        // draw the horizontal line from the source case / event to the target case / event
        this.graphEntityContainer.append('line')
            .attr('class', `relationship source-entity-${sourceEntityId}`)
            .attr('stroke', this.graphConfig.relationshipStrokeColor)
            .attr('stroke-width', `${this.relationshipStrokeWidth}px`)
            .attr('x1', lineStartX)
            .attr('y1', lineStartY)
            .attr('x2', lineEndX)
            .attr('y2', lineEndY);

        // define line of intersection
        const line: Line = {
            x1: x1,
            x2: x2,
            y1: y1,
            y2: y2
        };

        // add Y line to list of intersections
        if (!this.relationshipOccupiedSpaces.yLines.values[lineStartY]) {
            this.relationshipOccupiedSpaces.yLines.values[lineStartY] = [];
        }
        this.relationshipOccupiedSpaces.yLines.values[lineStartY].push(line);

        // set max relationship line y
        this.relationshipOccupiedSpaces.yLines.max = lineStartY < this.relationshipOccupiedSpaces.yLines.max ?
            this.relationshipOccupiedSpaces.yLines.max :
            lineStartY;

        // add X line to list of intersections
        if (!this.relationshipOccupiedSpaces.xLines.values[lineEndX]) {
            this.relationshipOccupiedSpaces.xLines.values[lineEndX] = [];
        }
        this.relationshipOccupiedSpaces.xLines.values[lineEndX].push(line);

        // set max relationship line x
        this.relationshipOccupiedSpaces.xLines.max = lineEndX < this.relationshipOccupiedSpaces.xLines.max ?
            this.relationshipOccupiedSpaces.xLines.max :
            lineEndX;

        // draw the vertical line (arrow's base)
        this.graphEntityContainer.append('line')
            .attr('class', `relationship source-entity-${sourceEntityId}`)
            .attr('stroke', this.graphConfig.relationshipStrokeColor)
            .attr('stroke-width', `${this.relationshipStrokeWidth}px`)
            .attr('x1', lineEndX)
            .attr('y1', lineEndY)
            .attr('x2', lineEndX)
            .attr('y2', arrowY);

        // draw the top of the arrow
        this.graphEntityContainer.append('polygon')
            .attr('class', `relationship source-entity-${sourceEntityId}`)
            .attr('fill', this.graphConfig.relationshipStrokeColor)
            .attr('points', `${lineEndX},${arrowY} ${lineEndX - 5},${(arrowY - 8)} ${lineEndX + 5},${arrowY - 8}`);
    }

    /**
     * Draw graph center cells
     */
    private drawGraphCenterNames() {
        // position svg
        const groupContainer = this.graphEntityContainer.append('svg')
            .attr('x', 0)
            .attr('y', this.entityDetailsCellHeight);

        // draw cells
        (this.centerNameCells || []).forEach((cell: GroupCell) => {
            // determine bounds
            const x: number = cell.entityStartIndex * (this.marginBetween + this.cellWidth);
            const width: number = cell.cells * (this.marginBetween + this.cellWidth) - this.marginBetween;
            const height: number = this.entityDetailsTextLineCellHeight;

            // determine best position for this group
            let y: number = 0;
            while (
                this.centerOccupiedLines[y] &&
                x >= this.centerOccupiedLines[y].x1 && x <= this.centerOccupiedLines[y].x2
            ) {
                // next line
                y += this.entityDetailsTextLineCellHeight + this.entityDetailsTextLineSpaceBetween;
            }

            // map group zone
            cell.rect = {
                x: x,
                y: y,
                width: width,
                height: height
            };

            // occupy line
            this.centerOccupiedLines[y] = {
                x1: x,
                x2: x + width
            };

            // group handler
            const group = groupContainer.append('svg')
                .attr('x', x)
                .attr('y', y);

            // draw cell rectangle
            group.append('rect')
                .attr('width', width)
                .attr('height', height)
                .attr('fill', 'transparent')
                .attr('stroke', 'black')
                .attr('stroke-width', '1')
                .attr('shape-rendering', 'optimizeSpeed');

            // draw color rectangle
            group.append('rect')
                .attr('x', this.entityDetailsTextLinesColorMargin)
                .attr('y', this.entityDetailsTextLinesColorMargin)
                .attr('width', this.entityDetailsTextLinesColorWidth)
                .attr('height', height - this.entityDetailsTextLinesColorMargin * 2)
                .attr('fill', cell.bgColor);

            // clip path for text
            const pathId: string = `clipPath${uuid()}`;
            const textX: number = this.entityDetailsTextLinesColorMargin * 2 + this.entityDetailsTextLinesColorWidth;
            group.append('clipPath')
                .attr('id', pathId)
                .append('rect')
                .attr('x', textX)
                .attr('width', width - (textX + this.entityDetailsTextLinesColorMargin))
                .attr('height', height);

            // determine center name
            const renderName = cell.name ?
                this.centerTokenToNameMap[cell.name] || cell.name :
                cell.name;

            // draw cell text
            group.append('text')
                .text(renderName)
                .attr('clip-path', `url(#${pathId})`)
                .attr('fill', 'black')
                .attr('alignment-baseline', 'central')
                .attr('x', textX)
                .attr('y', height / 2);
        });
    }

    /**
     * Determine graph height based on the data
     */
    private determineGraphHeight(): number {
        // determine number of dates displayed
        const daysNo = Object.keys(this.datesMap).length;

        // determine container height accordingly to max number of cells
        const datesHeight: number = this.entityDetailsCellHeight + this.entityDetailsTextLinesHeight + daysNo * this.cellHeight;

        // visual-id-column-height + days-no * cell-height
        return Math.max(datesHeight, this.relationshipOccupiedSpaces.yLines.max)
            + this.graphExtraHeight;
    }

    /**
     * Get the list of days of a period
     */
    private getDaysBetween(startDate: string, endDate: string): string[] {
        // start from the start date and increment it
        const dateMoment = moment(startDate).startOf('day');
        const endDateMoment = moment(endDate).startOf('day');

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
    private translate(
        token: string,
        data?: any
    ): string {
        // if we have data, then we can't truly cache it
        if (data) {
            return this.i18nService.instant(
                token,
                data
            );
        }

        // cache
        if (!this.translationsMap[token]) {
            this.translationsMap[token] = this.i18nService.instant(token);
        }

        return this.translationsMap[token];
    }

    /**
     * Clear
     */
    public destroy() {
        // remove window listener
        this.removeWindowScrollListener();

        // remove hover div
        this.removeHoverDiv();
    }

    /**
     * Hide hover div
     */
    private hideHoverDiv() {
        // retrieve hover div
        if (!this.graphHoverDiv) {
            return;
        }

        // hide div if we don't have anything to display
        this.graphHoverDiv.style.display = 'none';
    }

    /**
     * Determine center name used for determining same centers
     * @param centerName
     */
    private centerNameToCompareValue(centerName): string {
        return centerName ?
            centerName.trim().toLowerCase().replace(/[^a-z0-9\s]/gi, '').replace(/\s\s+/g, ' ') :
            centerName;
    }
}
