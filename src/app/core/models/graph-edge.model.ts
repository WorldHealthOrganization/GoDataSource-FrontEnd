import * as _ from 'lodash';
import { EntityType } from './entity-type';
import { Constants } from './constants';

export class GraphEdgeModel {
    id: string;
    source: string;
    target: string;
    sourceType: EntityType;
    targetType: EntityType;
    edgeColor: string;
    edgeStyle: string;
    label: string;
    fontFamily: string;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.source = _.get(data, 'source');
        this.target = _.get(data, 'target');
        this.sourceType = _.get(data, 'sourceType');
        this.targetType = _.get(data, 'targetType');
        this.edgeColor = _.get(data, 'edgeColor', Constants.DEFAULT_COLOR_CHAINS);
        this.edgeStyle = _.get(data, 'edgeStyle', 'solid');
        this.label = _.get(data, 'label', '');
        this.fontFamily = 'Roboto, "Helvetica Neue", sans-serif';
    }

    static getEdgeIconContextOfTransmission(context: string): string | undefined {
        switch (context) {
            case Constants.CONTEXT_OF_TRANSMISSION.CO_WORKERS:
                return 'contacts';
            case Constants.CONTEXT_OF_TRANSMISSION.FAMILY:
                return 'people';
            case Constants.CONTEXT_OF_TRANSMISSION.FRIENDS:
                return 'person_add';
            case Constants.CONTEXT_OF_TRANSMISSION.FUNERAL:
                return 'turned_in';
            case Constants.CONTEXT_OF_TRANSMISSION.NEIGHBOUR:
                return 'nature_people';
            case Constants.CONTEXT_OF_TRANSMISSION.NOSOCOMIAL:
                return 'airline_seat_flat';
            case Constants.CONTEXT_OF_TRANSMISSION.TRAVEL:
                return 'commute';
            case Constants.CONTEXT_OF_TRANSMISSION.UNKNOWN:
                return 'help';
            default:
                return '';
        }
    }

    static getEdgeIconExposureType(type: string): string | undefined {
        switch (type) {
            case Constants.EXPOSURE_TYPE.DIRECT_PHYSICAL_CONTACT:
                return 'touch_app';
            case Constants.EXPOSURE_TYPE.SLEPT_ATE_SPENT_TIME_TOGETHER:
                return 'hotel';
            case Constants.EXPOSURE_TYPE.TOUCHED_BODY_FLUIDS:
                return 'pan_tool';
            case Constants.EXPOSURE_TYPE.TOUCHED_LINENS_CLOTHES:
                return 'free_breakfast';
            default:
                return '';
        }
    }

    /**
     * set the icon based on the context of transmission value
     * @param relationshipData
     */
    setEdgeIconContextOfTransmission(relationshipData) {
        this.label = GraphEdgeModel.getEdgeIconContextOfTransmission(relationshipData.socialRelationshipTypeId);
    }

    /**
     * set the icon based on the exposure type value
     * @param relationshipData
     */
    setEdgeIconExposureType(relationshipData) {
        this.label = GraphEdgeModel.getEdgeIconExposureType(relationshipData.exposureTypeId);
    }

    /**
     * set edge line style based on certainity level
     * @param relationshipData
     */
    setEdgeStyle(relationshipData) {
        if (relationshipData.certaintyLevelId === Constants.CERTAINITY_LEVEL.LOW) {
            this.edgeStyle = 'dotted';
        } else if (relationshipData.certaintyLevelId === Constants.CERTAINITY_LEVEL.MEDIUM) {
            this.edgeStyle = 'dashed';
        } else {
            this.edgeStyle = 'solid';
        }
    }

}
