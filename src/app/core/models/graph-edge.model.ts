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

    /**
     * set the icon based on the context of transmission value
     * @param relationshipData
     */
    setEdgeIconContextOfTransmission(relationshipData) {
        if (relationshipData.socialRelationshipTypeId === Constants.CONTEXT_OF_TRANSMISSION.CO_WORKERS) {
            this.label = 'contacts';
        } else if (relationshipData.socialRelationshipTypeId === Constants.CONTEXT_OF_TRANSMISSION.FAMILY) {
            this.label = 'people';
        } else if (relationshipData.socialRelationshipTypeId === Constants.CONTEXT_OF_TRANSMISSION.FRIENDS) {
            this.label = 'person_add';
        } else if (relationshipData.socialRelationshipTypeId === Constants.CONTEXT_OF_TRANSMISSION.FUNERAL) {
            this.label = 'turned_in';
        } else if (relationshipData.socialRelationshipTypeId === Constants.CONTEXT_OF_TRANSMISSION.NEIGHBOUR) {
            this.label = 'nature_people';
        } else if (relationshipData.socialRelationshipTypeId === Constants.CONTEXT_OF_TRANSMISSION.NOSOCOMIAL) {
            this.label = 'airline_seat_flat';
        } else if (relationshipData.socialRelationshipTypeId === Constants.CONTEXT_OF_TRANSMISSION.TRAVEL) {
            this.label = 'commute';
        } else if (relationshipData.socialRelationshipTypeId === Constants.CONTEXT_OF_TRANSMISSION.UNKNOWN) {
            this.label = 'help';
        }
    }

    /**
     * set the icon based on the exposure type value
     * @param relationshipData
     */
    setEdgeIconExposureType(relationshipData) {
        if (relationshipData.exposureTypeId === Constants.EXPOSURE_TYPE.DIRECT_PHYSICAL_CONTACT) {
            this.label = 'touch_app';
        } else if (relationshipData.exposureTypeId === Constants.EXPOSURE_TYPE.SLEPT_ATE_SPENT_TIME_TOGETHER) {
            this.label = 'hotel';
        } else if (relationshipData.exposureTypeId === Constants.EXPOSURE_TYPE.TOUCHED_BODY_FLUIDS) {
            this.label = 'pan_tool';
        } else if (relationshipData.exposureTypeId === Constants.EXPOSURE_TYPE.TOUCHED_LINENS_CLOTHES) {
            this.label = 'free_breakfast';
        }
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
