import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import * as _ from 'lodash';
import { TransmissionChainBarsModel } from '../typings/transmission-chain-bars.model';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { EntityBarModel } from '../typings/entity-bar.model';
import { EntityType } from '../../../core/models/entity-type';
import { v4 as uuid } from 'uuid';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { LocalizationHelper } from '../../../core/helperClasses/localization-helper';

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
  // default header color
  private static DEFAULT_HEADER_COLUMN = 'transparent';
  private static DEFAULT_HEADER_COLUMN_HIGHLIGHTED = 'rgba(var(--gd-primary-rgb), 0.25)';

  // regular cell width
  private readonly cellWidthDefault = 91;
  private cellWidth = this.cellWidthDefault;
  // regular cell height
  private cellHeight = 25;
  // space between cases / events
  private marginBetween = 10;
  // case / event details cell height (first row)
  private entityDetailsCellHeight = 100;
  // relationship X margin - position of relationship vertical lines on X position related to cell left position
  private relationshipXMargin = 5;
  // cell left padding
  private cellXPadding = this.relationshipXMargin * 2;
  // extra graph height
  // - 30 for scrollbar (keep extra 30px for horizontal scrollbar)
  // keep occupied space to determine intersection
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
    isolationColor: 'var(--gd-primary)',
    isolationTextColor: 'var(--gd-background)',
    labResultColor: 'var(--gd-warning)',
    labResultTextColor: 'var(--gd-text)',
    dateOnsetColor: 'var(--gd-background)',
    dateOnsetTextColor: 'var(--gd-text)',
    dateOutcomeColor: 'var(--gd-primary-alt)',
    dateOutcomeTextColor: 'var(--gd-background)',
    dateOutcomeBurialColor: 'var(--gd-danger)',
    dateOutcomeBurialTextColor: 'var(--gd-background)',
    // opacity for cells that are before date of onset
    beforeDateOfOnsetOpacity: 0.35,
    relationshipStrokeColor: 'var(--gd-secondary)'
  };

  // data used to draw the graph
  private graphData: TransmissionChainBarsModel;
  // graph container
  private graphContainer: any;
  // child section/container for the dates
  private graphDates: any;
  private graphDatesContainer: any;
  private graphDatesContainerSVG: any;
  // child section/container for the cases / events
  private graphEntity: any;
  private graphEntitySectionHeader: any;
  private graphEntitySectionHeaderSVG: any;
  private graphEntitySectionHeaderHeight: number;
  private graphEntitySectionDivContainer: any;

  // dates map to know the row # of each day date
  private hover: {
    selected: {
      date: string,
      entityColumnIdx: number
    },
    rects: {
      dates: {
        [date: string]: any
      },
      entities: {
        [entityColumnIdx: number]: any
      }
    }
  } = {
      selected: {
        date: undefined,
        entityColumnIdx: undefined
      },
      rects: {
        dates: {},
        entities: {}
      }
    };
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

  // center name group line height
  private entityDetailsTextLineCellHeight: number = 24;
  private entityDetailsTextLineSpaceBetween: number = 5;
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
    private router: Router,
    private location: Location
  ) {}

  /**
   * Draw graph
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

    // cache graph data
    this.graphData = data;

    // collect the dates to be displayed on the graph (Oy axis)
    this.collectDates();

    // create graph d3 container
    this.graphContainer = d3.select(containerNative);

    // Determine center name groups
    this.determineCenterNameGroups();

    // calculate header height
    this.graphEntitySectionHeaderHeight = this.determineGraphHeaderHeight();

    // draw the dates column
    this.drawDates();

    // draw the cases / events
    this.remainingRelationsToDraw = {};
    this.centerOccupiedLines = {};
    this.drawEntities();
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
    // create dates section
    this.graphDates = this.graphContainer.append('div')
      .classed('gd-dates-section', true);

    // create a div to store the dates container
    // set the same height as entity header container height
    this.graphDates.append('div')
      .classed('gd-dates-section-header', true)
      .style('height', `${this.graphEntitySectionHeaderHeight}px`);

    // create dates container
    this.graphDatesContainer = this.graphDates.append('div')
      .classed('gd-dates-section-container', true)
      .style('height', `calc(100% - ${this.graphEntitySectionHeaderHeight}px)`);

    // create SVG container
    this.graphDatesContainerSVG = this.graphDatesContainer.append('svg')
      .classed('gd-dates-section-container-svg', true);

    // draw each date
    this.hover.rects.dates = {};
    Object.keys(this.datesMap).forEach((dayDate, index) => {
      // set position (top-left corner)
      const dateContainer = this.graphDatesContainerSVG.append('g')
        .attr('transform', `translate(0, ${index * this.cellHeight})`);
      this.hover.rects.dates[dayDate] = dateContainer.append('rect')
        .attr('fill', TransmissionChainBarsService.DEFAULT_HEADER_COLUMN)
        .attr('width', 'calc(100% + 14px)')
        .attr('height', this.cellHeight);
      dateContainer.append('text')
        .text(dayDate)
        .attr('fill', 'black')
        .attr('alignment-baseline', 'central')
        .attr('x', 14)
        .attr('y', this.cellHeight / 2);
    });
  }

  /**
   * Mouse move - hover div
   */
  private initSvgMouseMove() {
    const svg: SVGSVGElement = this.graphEntitySectionDivContainer.node();
    const pt = svg.createSVGPoint();
    svg.addEventListener(
      'mouseleave',
      () => {
        this.hideHoverSelection();
      }
    );
    svg.addEventListener(
      'mousemove',
      (evt: {
        clientX: number,
        clientY: number,
        screenX: number,
        screenY: number,
        layerY?: number
      }) => {
        // is there a point in checking position ?
        if (evt.layerY <= this.graphEntitySectionHeaderHeight) {
          // hide div if we don't have anything to display
          this.hideHoverSelection();

          // finished
          return;
        }

        // get the cursor point, translated into svg coordinates
        pt.x = evt.clientX;
        pt.y = evt.clientY;
        const cursorPT = pt.matrixTransform(svg.getScreenCTM().inverse());

        // determine date
        const date: string = LocalizationHelper.displayDate(LocalizationHelper.toMoment(this.graphData.minGraphDate)
          .add(Math.floor(cursorPT.y / this.cellHeight), 'days'));

        // determine person name
        const entityColumnIdx = Math.floor(cursorPT.x / (this.marginBetween + this.cellWidth));

        // if date not mapped, then there is no point in displaying it
        if (
          this.datesMap[date] === undefined ||
          !this.hover.rects.dates[date] ||
          !this.hover.rects.entities[entityColumnIdx]
        ) {
          // hide div if we don't have anything to display
          this.hideHoverSelection();

          // finished
          return;
        }

        // already selected / highlighted ?
        if (
          this.hover.selected.date === date &&
          this.hover.selected.entityColumnIdx === entityColumnIdx
        ) {
          // nothing to do
          return;
        }

        // hide div if we don't have anything to display
        this.hideHoverSelection();

        // set selected headers
        this.hover.selected.date = date;
        this.hover.selected.entityColumnIdx = entityColumnIdx;
        this.hover.rects.dates[date].attr('fill', TransmissionChainBarsService.DEFAULT_HEADER_COLUMN_HIGHLIGHTED);
        this.hover.rects.entities[entityColumnIdx].attr('fill', TransmissionChainBarsService.DEFAULT_HEADER_COLUMN_HIGHLIGHTED);
      },
      false
    );
  }

  /**
   * Check if we should draw entity
   */
  private shouldDrawEntity(entityId: string): boolean {
    return !!this.graphData.personsMap[entityId]?.date;
  }

  /**
   * Draw the cases & events (one column for each case / event)
   */
  private drawEntities() {
    // determine graph width based on the number of cases & events
    // entities-no * (margin-between-entities + entity-cell-width) + placeholder-for-overflowing-name-or-visual-id
    const entitiesGraphWidth = this.graphData.personsOrder.filter((entityId) => this.shouldDrawEntity(entityId)).length * (this.marginBetween + this.cellWidth) + 20;

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

    // create a div for entities section
    this.graphEntity = this.graphContainer.append('div')
      .classed('gd-entities-section', true);

    // create entities header
    this.graphEntitySectionHeader = this.graphEntity.append('div')
      .classed('gd-entities-section-header', true)
      .style('height', `${this.graphEntitySectionHeaderHeight}px`);

    // create SVG header container
    this.graphEntitySectionHeaderSVG = this.graphEntitySectionHeader.append('svg')
      .classed('gd-entities-section-header-svg', true)
      .attr('width', entitiesGraphWidth);

    // create entities container body
    const graphEntitySectionDiv = this.graphEntity.append('div')
      .classed('gd-entities-section-container', true)
      .style('height', `calc(100% - ${this.graphEntitySectionHeaderHeight}px)`);

    // create SVG container
    this.graphEntitySectionDivContainer = graphEntitySectionDiv.append('svg')
      .classed('gd-entities-section-container-svg', true)
      .attr('width', entitiesGraphWidth);

    // listen for hover mouse to show data & person
    this.initSvgMouseMove();

    // draw each case / event column
    this.hover.rects.entities = {};
    this.graphData.personsOrder.forEach((entityId) => {
      // did we already draw this case / event?
      if (this.entityColumnMap[entityId] === undefined) {
        this.drawEntity(entityId);
      }
    });

    // draw center names
    this.drawGraphCenterNames();

    // set graph height
    const graphHeight: number = this.determineGraphHeight();
    this.graphDatesContainerSVG.attr('height', graphHeight);
    this.graphEntitySectionDivContainer.attr('height', graphHeight);

    // synchronize scroll bars
    const graphEntitySectionDivDOM = graphEntitySectionDiv.node();
    graphEntitySectionDivDOM.addEventListener('scroll', () => {
      // hide hover selection
      this.hideHoverSelection();

      // scroll header columns
      this.graphEntitySectionHeader.node().scrollLeft = graphEntitySectionDivDOM.scrollLeft;
      this.graphDatesContainer.node().scrollTop = graphEntitySectionDivDOM.scrollTop;
    });
  }

  /**
   * Draw a case / event block
   */
  private drawEntity(entityId: string) {
    // keep case / event data for later use
    if (!this.shouldDrawEntity(entityId)) {
      return;
    }

    // the column where we draw the case / event
    const entityData = this.graphData.personsMap[entityId] as EntityBarModel;
    const entityColumnIdx = this.currentColumnIdx;

    // increment the current column index for when drawing a new case / event
    this.currentColumnIdx++;

    // add case / event to the map, so we know it's (already) drawn
    this.entityColumnMap[entityData.id] = entityColumnIdx;

    // draw the case / event column header
    const headerWidthPerColumn: number = this.marginBetween + this.cellWidth;
    const entityColumnContainerHeader = this.graphEntitySectionHeaderSVG.append('svg')
      .attr('x', entityColumnIdx * headerWidthPerColumn)
      .attr('y', 0);

    // draw the case / event column container
    const entityColumnContainer = this.graphEntitySectionDivContainer.append('svg')
      .attr('x', entityColumnIdx * headerWidthPerColumn)
      .attr('y', 0);

    // entity link
    const url: string = entityData.type === EntityType.EVENT ?
      `/events/${entityData.id}/view` :
      `/cases/${entityData.id}/view`;
    const externURL: string = this.location.prepareExternalUrl(url);
    const entityDetailsGroupLink = entityColumnContainerHeader
      .append('a')
      .attr('href', externURL);
    this.hover.rects.entities[entityColumnIdx] = entityDetailsGroupLink.append('rect')
      .attr('width', `${headerWidthPerColumn}px`)
      .attr('height', '100%')
      .attr('fill', TransmissionChainBarsService.DEFAULT_HEADER_COLUMN);
    const entityDetailsGroupSVG = entityDetailsGroupLink.append('svg');

    // handle single page application link, so we don't reload modules
    entityDetailsGroupSVG.on('click', (event) => {
      // stop propagation
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      // redirect
      this.router.navigate([url]);
    });

    // draw the case / event details cell
    const entityDetailsGroupG = entityDetailsGroupSVG.append('g')
      .attr('transform', `translate(${this.cellWidth / 2 - 32} 10) rotate(-54, 32, ${this.entityDetailsCellHeight / 2})`)
      .attr('class', 'gd-entities-section-header-entity-info');

    // case full name / / event name
    const name: string = (entityData.firstName ? entityData.firstName + ' ' : '') +
            (entityData.lastName ? entityData.lastName : '');
    entityDetailsGroupG.append('text')
      .text(name)
      .attr('fill', 'black')
      .attr('font-size', '12px')
      .attr('alignment-baseline', 'central')
    // center the text vertically
      .attr('y', this.entityDetailsCellHeight / 2);

    // case visual ID
    const visualId: string = entityData.visualId ? entityData.visualId.trim() : null;
    if (visualId) {
      entityDetailsGroupG.append('text')
        .text(entityData.visualId)
        .attr('fill', 'black')
        .attr('font-size', '12px')
        .attr('alignment-baseline', 'central')
      // center the text vertically and add extra 15px to display it on the next row
        .attr('y', this.entityDetailsCellHeight / 2 + 15);
    }



    // keep case date of onset / event date for later use
    const dateMoment = LocalizationHelper.toMoment(entityData.date).startOf('day');
    const date = LocalizationHelper.displayDate(dateMoment);

    // determine all cell that we need to draw
    const cells: DrawCell[] = [];

    // date of onset to cells that we need to draw
    const dateOfOnsetLabel = this.translate('LNG_PAGE_TRANSMISSION_CHAIN_BARS_CASE_ONSET_LABEL');
    cells.push(new DrawCell({
      type: drawCellType.DATE_OF_ONSET,
      date: LocalizationHelper.displayDate(date),
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
              date: LocalizationHelper.displayDate(entityData.dateOfBurial),
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
        date: LocalizationHelper.displayDate(entityData.dateOfOutcome),
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
          date: LocalizationHelper.displayDate(isolationDate),
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
        labResultDate = LocalizationHelper.displayDate(labResult.dateOfResult);
      } else {
        labResultDate = LocalizationHelper.displayDate(labResult.dateSampleTaken);
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
            const y: number = this.datesMap[drawCell.date] * this.cellHeight;
            const group = entityColumnContainer.append('g')
              .attr(
                'transform',
                `translate(${x}, ${y})`
              );

            // check if date is before date of onset
            const opacity = LocalizationHelper.toMoment(drawCell.date).isBefore(dateMoment) ?
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
      .attr('class', 'gd-entities-section-container-entity-bar')
      .attr('x', 0)
      .attr('y', this.datesMap[date] * this.cellHeight);
    entityBar.append('rect')
      .attr('width', this.cellWidth)
      .attr('height', (LocalizationHelper.toMoment(entityData.lastGraphDate).startOf('day').diff(dateMoment, 'days') + 1) * this.cellHeight)
      .attr('fill', 'transparent')
      .attr('stroke', 'var(--gd-secondary)')
      .attr('stroke-width', '1')
      .attr('shape-rendering', 'optimizeSpeed');

    // show relationships with different color when hover on a Case / Event
    entityBar.on('click', () => {
      // selected case / event does already have accent?
      if (entityBar.classed('accent')) {
        // selected case / event doesn't have accent;
        // remove accent from all elements
        this.graphEntitySectionDivContainer.selectAll('.accent')
          .classed('accent', false);
      } else {
        // selected case / event doesn't have accent;
        // remove accent from all elements
        this.graphEntitySectionDivContainer.selectAll('.accent')
          .classed('accent', false);

        // add accent to case / event
        entityBar.classed('accent', true);

        // add accent to relationships
        const sourceEntityRelationships = this.graphEntitySectionDivContainer
        // find the relationships where current case / event is source
          .selectAll(`.gd-entities-section-container-source-entity-${entityData.id}`)
        // show relationships with accent color
          .classed('accent', true)
        // remove them temporarily
          .remove();

        // add them back (so they are rendered on top of the others)
        _.get(sourceEntityRelationships, '_groups[0]', []).forEach((relationshipElem) => {
          this.graphEntitySectionDivContainer.append(() => relationshipElem);
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

    const sourceEntityFirstGraphDate = LocalizationHelper.displayDate(sourceEntityData.date);
    const targetEntityFirstGraphDate = LocalizationHelper.displayDate(targetEntityData.date);

    // mark the relation as being drawn, to avoid duplicates
    _.set(this.drawnRelations, `[${sourceEntityId}][${targetEntityId}]`, true);

    // determine line coordinates
    const leftOrRight = (sourceEntityColumnIdx < targetEntityColumnIdx) ? 1 : 0;
    const halfCellHeight = Math.round(this.cellHeight / 2);
    const lineInitialStartY = (this.datesMap[sourceEntityFirstGraphDate] * this.cellHeight) + halfCellHeight;
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
    const arrowY = this.datesMap[targetEntityFirstGraphDate] * this.cellHeight;

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

      // if bigger than parent cell width, then we need to draw it on top...we can't draw it somewhere else...
      if (lineEndX > initialLineStartY + this.cellWidth - this.relationshipXMargin) {
        // reset position to the beginning of the cell
        lineEndX = initialLineStartY;

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
      this.graphEntitySectionDivContainer.append('line')
        .attr('class', `gd-entities-section-container-relationship gd-entities-section-container-source-entity-${sourceEntityId}`)
        .attr('stroke', this.graphConfig.relationshipStrokeColor)
        .attr('stroke-width', `${this.relationshipStrokeWidth}px`)
        .attr('x1', lineStartX)
        .attr('y1', y)
        .attr('x2', lineStartX)
        .attr('y2', lineEndY);
    }

    // draw the horizontal line from the source case / event to the target case / event
    this.graphEntitySectionDivContainer.append('line')
      .attr('class', `gd-entities-section-container-relationship gd-entities-section-container-source-entity-${sourceEntityId}`)
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
    this.graphEntitySectionDivContainer.append('line')
      .attr('class', `gd-entities-section-container-relationship gd-entities-section-container-source-entity-${sourceEntityId}`)
      .attr('stroke', this.graphConfig.relationshipStrokeColor)
      .attr('stroke-width', `${this.relationshipStrokeWidth}px`)
      .attr('x1', lineEndX)
      .attr('y1', lineEndY)
      .attr('x2', lineEndX)
      .attr('y2', arrowY);

    // draw the top of the arrow
    this.graphEntitySectionDivContainer.append('polygon')
      .attr('class', `gd-entities-section-container-relationship gd-entities-section-container-source-entity-${sourceEntityId}`)
      .attr('fill', this.graphConfig.relationshipStrokeColor)
      .attr('points', `${lineEndX},${arrowY} ${lineEndX - 5},${(arrowY - 8)} ${lineEndX + 5},${arrowY - 8}`);
  }

  /**
   * Draw graph center cells
   */
  private drawGraphCenterNames() {
    // position svg
    const groupContainer = this.graphEntitySectionHeaderSVG.append('svg')
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

      // determine center name
      const renderName = cell.name ?
        this.centerTokenToNameMap[cell.name] || cell.name :
        cell.name;

      // group handler
      const group = groupContainer.append('svg')
        .attr('x', x)
        .attr('y', y);

      // draw cell rectangle
      group.append('title')
        .text(renderName);

      // draw cell rectangle
      group.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'white')
        .attr('stroke', 'var(--gd-secondary)')
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

      // draw cell text
      group.append('text')
        .text(renderName)
        .attr('clip-path', `url(#${pathId})`)
        .attr('fill', 'var(--gd-text)')
        .attr('alignment-baseline', 'central')
        .attr('x', textX)
        .attr('y', height / 2);
    });
  }

  /**
   * Determine graph header height based on the maximum center names per entity
   */
  private determineGraphHeaderHeight(): number {
    // determine max of number of center name
    const maxCenterNames = Math.max(0, ...Object.values(this.entityToCenterNameCell).map((t) => Object.keys(t).length));

    // add entity name cell height and each center name cell height
    return this.entityDetailsCellHeight + maxCenterNames * (this.entityDetailsTextLineCellHeight + this.entityDetailsTextLineSpaceBetween);
  }

  /**
   * Determine graph height based on the data
   */
  private determineGraphHeight(): number {
    // determine number of dates displayed
    const daysNo = Object.keys(this.datesMap).length;

    // determine container height accordingly to max number of cells
    const datesHeight: number = daysNo * this.cellHeight;

    // visual-id-column-height + days-no * cell-height
    return Math.max(datesHeight, this.relationshipOccupiedSpaces.yLines.max);
  }

  /**
   * Get the list of days of a period
   */
  private getDaysBetween(startDate: string, endDate: string): string[] {
    // start from the start date and increment it
    const dateMoment = LocalizationHelper.toMoment(startDate).startOf('day');
    const endDateMoment = LocalizationHelper.toMoment(endDate).startOf('day');

    const days = [];
    while (!dateMoment.isAfter(endDateMoment)) {
      // get date in proper format
      const dayDate = LocalizationHelper.displayDate(dateMoment);
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
   * Hide hover div
   */
  private hideHoverSelection() {
    // reset previous header date column
    if (
      this.hover.selected.date &&
      this.hover.rects.dates[this.hover.selected.date]
    ) {
      // deselect column
      this.hover.rects.dates[this.hover.selected.date].attr(
        'fill',
        TransmissionChainBarsService.DEFAULT_HEADER_COLUMN
      );
    }

    // reset previous header entity column
    if (
      this.hover.selected.entityColumnIdx !== undefined &&
      this.hover.rects.entities[this.hover.selected.entityColumnIdx]
    ) {
      // deselect column
      this.hover.rects.entities[this.hover.selected.entityColumnIdx].attr(
        'fill',
        TransmissionChainBarsService.DEFAULT_HEADER_COLUMN
      );
    }

    // reset
    this.hover.selected.date = undefined;
    this.hover.selected.entityColumnIdx = undefined;
  }

  /**
   * Determine center name used for determining same centers
   */
  private centerNameToCompareValue(centerName): string {
    return centerName ?
      centerName.trim().toLowerCase().replace(/[^a-z0-9\s]/gi, '').replace(/\s\s+/g, ' ') :
      centerName;
  }
}
