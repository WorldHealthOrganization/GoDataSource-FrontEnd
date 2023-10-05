import * as _ from 'lodash';
import { EntityType } from './entity-type';
import { Constants } from './constants';
import { LocalizationHelper } from '../helperClasses/localization-helper';

export class GraphNodeModel {
  id: string;
  name: string;
  type: EntityType;
  // date used when displaying the timeline
  dateTimeline: string;
  // use this field to remove nodes with no date for timeline
  displayTimeline: string;
  // default node colors and icon
  nodeColor: string;
  nodeNameColor: string;
  picture: string;
  label: string;
  // used to display the checkpoint nodes
  nodeType: string;
  shape: string = 'ellipse';
  labelPosition: string = 'top';
  height: number = 40;
  width: number = 40;
  borderColor: string;
  borderWidth: number;
  borderStyle: string;
  backgroundFill: string;
  backgroundFillStopColors: string;
  backgroundFillStopPositions: string;

  /**
     * Constructor
     */
  constructor(data = null) {
    this.id = _.get(data, 'id');
    this.name = _.get(data, 'name');
    this.type = _.get(data, 'type');
    this.dateTimeline = _.get(data, 'dateTimeline', '');
    this.displayTimeline = _.get(data, 'displayTimeline', 'element');
    this.nodeColor = _.get(data, 'nodeColor', Constants.DEFAULT_COLOR_CHAINS);
    this.nodeNameColor = _.get(data, 'nodeNameColor', Constants.DEFAULT_COLOR_CHAINS);
    this.picture = _.get(data, 'picture', 'none');
    this.nodeType = _.get(data, 'nodeType', 'data');
    this.borderColor = this.nodeColor;
    this.borderWidth = 3;
    this.borderStyle = 'solid';
    this.backgroundFill = 'solid';
    this.backgroundFillStopColors = this.nodeColor;
    this.backgroundFillStopPositions = '100%';

    // timeline render ?
    if ( this.dateTimeline ) {
      this.dateTimeline = LocalizationHelper.displayDate(this.dateTimeline);
    } else {
      this.displayTimeline = 'none';
    }

    // checkpoint ?
    if (this.nodeType === 'checkpoint') {
      this.label = this.name;
      this.shape = 'rectangle';
      this.nodeNameColor = Constants.DEFAULT_COLOR_CHAINS_TIMELINE_CHECKPOINTS_TEXT;
      this.labelPosition = 'center';
      this.width = 100;
      this.borderColor = Constants.DEFAULT_COLOR_CHAINS_TIMELINE_CHECKPOINTS_BORDER;
      this.nodeColor = Constants.DEFAULT_BACKGROUND_COLOR_NODES_CHAINS;
      // change color if first day of week or first day of month
      if (LocalizationHelper.toMoment(this.dateTimeline).isoWeekday() === 1) {
        // monday
        this.borderColor = Constants.DEFAULT_COLOR_CHAINS_TIMELINE_CHECKPOINTS_FIRST_DAY_OF_WEEK_BORDER;
        this.nodeNameColor = Constants.DEFAULT_COLOR_CHAINS_TIMELINE_CHECKPOINTS_FIRST_DAY_OF_WEEK_TEXT;
      }
      if (LocalizationHelper.toMoment(this.dateTimeline).format('D') === '1') {
        // first day of month
        this.borderColor = Constants.DEFAULT_COLOR_CHAINS_TIMELINE_CHECKPOINTS_FIRST_DAY_OF_MONTH_BORDER;
        this.nodeNameColor = Constants.DEFAULT_COLOR_CHAINS_TIMELINE_CHECKPOINTS_FIRST_DAY_OF_MONTH_TEXT;
      }
    }
  }

  /**
     * Default Node shape
     */
  static getNodeShapeType(type: EntityType): string | undefined {
    switch (type) {
      case EntityType.CASE:
        return 'circle';
      case EntityType.CONTACT:
        return 'pentagon';
      case EntityType.CONTACT_OF_CONTACT:
        return 'square';
      case EntityType.EVENT:
        return 'star';
      default:
        return 'circle';
    }
  }

  /**
     * Node shape by classification
     */
  static getNodeShapeClassification(classification: string): string | undefined {
    switch (classification) {
      case Constants.CASE_CLASSIFICATION.CONFIRMED:
        return 'circle';
      case Constants.CASE_CLASSIFICATION.PROBABLE:
        return 'square';
      case Constants.CASE_CLASSIFICATION.SUSPECT:
        return 'pentagon';
      default:
        return 'circle';
    }
  }

  /**
     * set the node shape based on the entity type
     * @param nodeData
     */
  setNodeShapeType(nodeData) {
    this.shape = GraphNodeModel.getNodeShapeType(nodeData.type);
  }

  /**
     * set the node shape based on the classification
     * @param nodeData
     */
  setNodeShapeClassification(nodeData) {
    this.shape = GraphNodeModel.getNodeShapeClassification(nodeData.model.classification);
  }
}
