import * as _ from 'lodash';
import { EntityType } from './entity-type';
import { Constants } from './constants';
import * as moment from 'moment';

export class GraphNodeModel {
    id: string;
    name: string;
    type: EntityType;
    dateOfReporting: string;

    // default node color
    nodeColor: string;
    label: string;


    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.type = _.get(data, 'type', '');
        this.dateOfReporting = _.get(data, 'dateOfReporting', '');
        if ( this.dateOfReporting ) {
            this.dateOfReporting = moment(this.dateOfReporting).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
        }

        // label to be used when displaying the timeline view
        this.label = this.name + '\n' + this.dateOfReporting;

        // set the color based on node type
        switch (this.type) {
            case EntityType.CASE: {
                this.nodeColor = '#4DB0A0';
                break;
            }
            case EntityType.CONTACT: {
                this.nodeColor = '#008DC9';
                break;
            }
            case EntityType.EVENT: {
                this.nodeColor = '#F44708';
                break;
            }
            default: {
                this.nodeColor = '#4DB0A0';
                break;
            }
        }
    }

}
