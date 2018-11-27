import * as _ from 'lodash';
import { EntityType } from './entity-type';
import { Constants } from './constants';
import * as moment from 'moment';

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

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.type = _.get(data, 'type', '');
        this.dateTimeline = _.get(data, 'dateTimeline', '');
        this.displayTimeline = _.get(data, 'displayTimeline', 'element');
        this.nodeColor = _.get(data, 'nodeColor', Constants.DEFAULT_COLOR_CHAINS);
        this.nodeNameColor = _.get(data, 'nodeNameColor', Constants.DEFAULT_COLOR_CHAINS);
        this.picture = _.get(data, 'picture', 'none');
        this.nodeType = _.get(data, 'nodeType', 'data');


        if ( this.dateTimeline ) {
            this.dateTimeline = moment(this.dateTimeline).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
        } else {
            this.displayTimeline = 'none';
        }

        if (this.nodeType === 'checkpoint') {
            this.label = this.name;
            this.shape = 'rectangle';
            this.nodeNameColor = Constants.DEFAULT_COLOR_CHAINS_TIMELINE_CHECKPOINTS;
            this.labelPosition = 'center';
            this.width = 95;
            // change color if first day of week or first day of month
            if (moment(this.dateTimeline).isoWeekday() === 1) {
                // monday
                this.nodeColor = Constants.DEFAULT_COLOR_CHAINS_TIMELINE_CHECKPOINTS_FIRST_DAY_OF_WEEK;
            }
            if (moment(this.dateTimeline).format('D') === '1') {
                // first day of month
                this.nodeColor = Constants.DEFAULT_COLOR_CHAINS_TIMELINE_CHECKPOINTS_FIRST_DAY_OF_MONTH;
            }
        }
    }
}
