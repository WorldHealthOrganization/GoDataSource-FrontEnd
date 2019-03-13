import * as _ from 'lodash';
import { EntityModel } from './entity.model';
import { CaseModel } from './case.model';
import { RelationshipModel } from './relationship.model';
import { EntityType } from './entity-type';
import * as moment from 'moment';
import { Constants } from './constants';
import { EventModel } from './event.model';

export class TransmissionChainRelation {

    constructor(
        public entityIds: string[]
    ) {}
}

export class TransmissionChainModel {
    // all Cases from Chain, mapped by Case ID
    casesMap: {}|{string: CaseModel} = {};
    // all events related to chain
    eventsMap: {}|{string: EventModel} = {};

    // all relations between Cases
    chainRelations: TransmissionChainRelation[] = [];
    // all entities related to Chain (Cases, Contacts and Events)
    nodes: {}|{string: EntityModel} = {};
    // all relationships between Chain entities
    relationships: RelationshipModel[];
    // whether the Chain is active or inactive
    active: boolean;
    // duration of the chain ( no of days )
    duration: number;
    // size of the chain ( no of cases )
    size: number;
    // total number of contacts
    contactsCount: number;
    // earliest date of onset
    earliestDateOfOnset: string;
    // root case
    rootPerson: CaseModel | EventModel;

    constructor(chainData = null, nodesData = {}, relationshipsData = []) {
        this.active = _.get(chainData, 'active', false);
        this.size = _.get(chainData, 'size', 0);
        this.contactsCount = _.get(chainData, 'contactsCount', 0);
        this.duration = _.get(chainData, 'period.duration', 0);

        const chainRelationsData = _.get(chainData, 'chain', []);

        // go through all chain relations
        _.each(chainRelationsData, (relation: string[]) => {

            // go through all Person(case or event) IDs from relation
            _.each(relation, (personId) => {
                if (
                    // if we didn't already collect this Case info
                    _.isEmpty(this.casesMap[personId]) &&
                    _.isEmpty(this.eventsMap[personId]) &&
                    // and if we have Case info
                    !_.isEmpty(nodesData[personId])
                ) {
                    // collect Case or Event info, mapped by personID
                    if (nodesData[personId].type === EntityType.EVENT) {
                        this.eventsMap[personId] = new EventModel(nodesData[personId]);
                        if (moment(nodesData[personId].date).isBefore(this.earliestDateOfOnset) || _.isEmpty(this.earliestDateOfOnset)) {
                            this.earliestDateOfOnset = moment(nodesData[personId].date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
                            this.rootPerson = this.eventsMap[personId];
                        }
                    } else {
                        this.casesMap[personId] = new CaseModel(nodesData[personId]);
                        if (moment(nodesData[personId].dateOfOnset).isBefore(this.earliestDateOfOnset) || _.isEmpty(this.earliestDateOfOnset)) {
                            this.earliestDateOfOnset = moment(nodesData[personId].dateOfOnset).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
                            this.rootPerson = this.casesMap[personId];
                        }
                    }
                }
            });

            // keep each relation
            this.chainRelations.push(new TransmissionChainRelation(relation));
        });

        // collect all entities from Chain
        for (const entityId in nodesData) {
            this.nodes[entityId] = new EntityModel(nodesData[entityId]);
        }

        // collect all relationships
        this.relationships = _.map(relationshipsData, (relData) => {
            return new RelationshipModel(relData);
        });

    }

    /**
     * Length of the chain - number of relations
     * @returns {number}
     */
    get length(): number {
        return this.chainRelations ? this.chainRelations.length : 0;
    }

    /**
     * Number of Cases in Chain
     * @returns {number}
     */
    get noCases() {
        return Object.keys(this.casesMap).length;
    }

    /**
     * Number of Alive Cases in Chain
     * @returns {any}
     */
    get noAliveCases() {
        return _.filter(Object.values(this.casesMap), (caseData: CaseModel) => {
            return caseData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED;
        }).length;
    }
}
