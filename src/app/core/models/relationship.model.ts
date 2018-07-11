import * as _ from 'lodash';

export enum RelationshipType {
    CASE = 'case',
    CONTACT = 'contact'
}

export class RelationshipPersonModel {
    id: string;
    type: string;

    constructor(dataOrId: {} | string = null, type: RelationshipType = null) {
        if (!dataOrId || _.isObject(dataOrId)) {
            this.id = _.get(dataOrId, 'id');
            this.type = _.get(dataOrId, 'type');
        } else {
            this.id = dataOrId as string;
            this.type = type;
        }
    }
}

export class RelationshipModel {
    persons: RelationshipPersonModel[];
    contactDate: string;
    contactDateEstimated: boolean;
    certaintyLevelId: number;
    exposureTypeId: string;
    exposureFrequencyId: string;
    exposureDurationId: string;
    socialRelationshipTypeId: string;
    clusterId: string;
    comment: string;

    constructor(data = null) {
        this.persons = _.get(data, 'persons', []);
        this.contactDate = _.get(data, 'contactDate');
        this.contactDateEstimated = _.get(data, 'contactDateEstimated', false);
        this.certaintyLevelId = _.get(data, 'certaintyLevelId');
        this.exposureTypeId = _.get(data, 'exposureTypeId');
        this.exposureFrequencyId = _.get(data, 'exposureFrequencyId');
        this.exposureDurationId = _.get(data, 'exposureDurationId');
        this.socialRelationshipTypeId = _.get(data, 'socialRelationshipTypeId');
        this.clusterId = _.get(data, 'clusterId');
        this.comment = _.get(data, 'comment');
    }
}
