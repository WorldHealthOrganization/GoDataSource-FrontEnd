import * as _ from 'lodash';
import { EntityModel } from './entity.model';
import { EntityType } from './entity-type';

export class RelationshipPersonModel {
    id: string;
    type: EntityType;
    source: boolean;
    target: boolean;

    constructor(data) {
        this.id = _.get(data, 'id');
        this.type = _.get(data, 'type');
        this.source = _.get(data, 'source', false);
        this.target = _.get(data, 'target', false);
    }
}

export class RelationshipModel {
    id: string;
    persons: RelationshipPersonModel[];
    contactDate: string;
    contactDateEstimated: boolean;
    certaintyLevelId: string;
    exposureTypeId: string;
    exposureFrequencyId: string;
    exposureDurationId: string;
    socialRelationshipTypeId: string;
    socialRelationshipDetail: string;
    clusterId: string;
    comment: string;
    people: EntityModel[];

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.persons = _.get(data, 'persons', []);
        this.contactDate = _.get(data, 'contactDate');
        this.contactDateEstimated = _.get(data, 'contactDateEstimated', false);
        this.certaintyLevelId = _.get(data, 'certaintyLevelId');
        this.exposureTypeId = _.get(data, 'exposureTypeId');
        this.exposureFrequencyId = _.get(data, 'exposureFrequencyId');
        this.exposureDurationId = _.get(data, 'exposureDurationId');
        this.socialRelationshipTypeId = _.get(data, 'socialRelationshipTypeId');
        this.socialRelationshipDetail = _.get(data, 'socialRelationshipDetail');
        this.clusterId = _.get(data, 'clusterId');
        this.comment = _.get(data, 'comment');

        const peopleData = _.get(data, 'people', []);
        this.people = _.map(peopleData, (entityData) => {
            return new EntityModel(entityData);
        });
    }

    /**
     * Get the related entity
     * @param {string} currentEntityId
     * @return {EntityModel}
     */
    relatedEntity(currentEntityId: string): EntityModel {
        return _.find(this.people, (entity: EntityModel) => {
            const entityId = _.get(entity, 'model.id');
            return entityId !== currentEntityId;
        });
    }

    /**
     * Whether a person is the Source of the relationship or the Target
     * @param entityId
     */
    isSource(entityId: string): boolean {
        // find person information
        const personInfo = _.find(this.persons, {id: entityId});
        return _.get(personInfo, 'source', false);
    }

    /**
     * Source Person
     */
    get sourcePerson(): RelationshipPersonModel {
        const data = _.find(this.persons, { source: true });
        return data ? new RelationshipPersonModel(data) : data;
    }
}

export class ReportDifferenceOnsetRelationshipModel extends RelationshipModel {
    differenceBetweenDatesOfOnset: number;

    constructor(data = null) {
        super(data);

        this.differenceBetweenDatesOfOnset = _.get(data, 'differenceBetweenDatesOfOnset', 0);
    }
}
