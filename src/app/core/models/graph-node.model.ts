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
    labelTimeline: string;

    // default node colors
    nodeColor: string;
    nodeNameColor: string;

    label: string;


    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.type = _.get(data, 'type', '');
        this.dateTimeline = _.get(data, 'dateTimeline', '');
        this.displayTimeline = _.get(data, 'displayTimeline', 'element');
        this.nodeColor = _.get(data, 'nodeColor', Constants.DEFAULT_COLOR_CHAINS);
        this.nodeNameColor = _.get(data, 'nodeNameColor', Constants.DEFAULT_COLOR_CHAINS);

        if ( this.dateTimeline ) {
            this.dateTimeline = moment(this.dateTimeline).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
        } else {
            this.displayTimeline = 'none';
        }

        // label to be used when displaying the timeline view
        this.labelTimeline = this.name + '\n' + this.dateTimeline;
    }

}
