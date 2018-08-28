import * as _ from 'lodash';
import { EntityModel } from './entity.model';
import { CaseModel } from './case.model';
import { RelationshipModel, RelationshipPersonModel } from './relationship.model';
import { EntityType } from './entity-type';
import { GraphNodeModel } from './graph-node.model';
import { GraphEdgeModel } from './graph-edge.model';

export class TransmissionChainRelation {

    constructor(
        public entityIds: string[]
    ) {
    }
}

export class TransmissionChainModel {
    // all Cases from Chain, mapped by Case ID
    casesMap: {}|{string: CaseModel} = {};
    // all relations between Cases
    chainRelations: TransmissionChainRelation[] = [];
    // all entities related to Chain (Cases, Contacts and Events)
    nodes: {}|{string: EntityModel} = {};
    // all relationships between Chain entities
    relationships: RelationshipModel[];
    // whether the Chain is active or inactive
    active: boolean;
    // length of the chain
    length: number;
    // duration of the chain ( no of days )
    duration: number;

    constructor(chainData = null, nodesData = {}, relationshipsData = []) {
        this.active = _.get(chainData, 'active', false);
        this.duration = _.get(chainData, 'period.duration', 0);
        this.length = chainData.chain.length;


        const chainRelationsData = _.get(chainData, 'chain', []);

        // go through all chain relations
        _.each(chainRelationsData, (relation: string[]) => {

            // go through all Case IDs from relation
            _.each(relation, (caseId) => {
                if (
                    // if we didn't already collect this Case info
                    _.isEmpty(this.casesMap[caseId]) &&
                    // and if we have Case info
                    !_.isEmpty(nodesData[caseId])
                ) {
                    // collect Case info, mapped by Case ID
                    this.casesMap[caseId] = new CaseModel(nodesData[caseId]);
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
            return !caseData.deceased;
        }).length;
    }

    /**
     * Find the first Case-Case Relationship, based on the 'contactDate'
     * Note: Relationships are ordered by 'contactDate' ASC by default
     * @returns {RelationshipModel}
     */
    get firstRelationship() {
        return _.find(this.relationships, (relationship: RelationshipModel) => {
            const persons = relationship.persons;

            // verify the 2 persons to be cases and at least one of them to be in the list of cases for this specific chain.
            return (
                persons.length === 2 &&
                persons[0].type === EntityType.CASE &&
                persons[1].type === EntityType.CASE &&
                this.casesMap[persons[0].id]
            );
        });
    }

    /**
     * Find the first Case in Chain
     * @returns {CaseModel}
     */
    get firstCase() {
        // get the 'source' Case of the first Case-Case Relationship
        const firstCasePerson: RelationshipPersonModel = _.find(this.firstRelationship.persons, (person: RelationshipPersonModel) => {
            return person.source;
        });

        // return the corresponding CaseModel
        return this.casesMap[firstCasePerson.id];
    }

    /**
     * convert transmission chain model to the format needed by the graph
     * @param {TransmissionChainModel} transmissionChain
     * @returns {any}
     */
    convertChainToGraphElements(): any {
        const graphData: any = {nodes: [], edges: [], edgesHierarchical: []};
        if ( !_.isEmpty(this) ) {
            if ( !_.isEmpty ( this.nodes) ) {
                _.forEach( this.nodes, function(node, key) {
                    const nodeData = new GraphNodeModel(node.model);
                    nodeData.type = node.type;
                    graphData.nodes.push({data: nodeData});
                });
            }

            if ( !_.isEmpty ( this.relationships) ) {
                _.forEach( this.relationships, function(relationship, key) {
                    const graphEdge = new GraphEdgeModel();
                    if ( relationship.persons[0].source ) {
                        graphEdge.source = relationship.persons[0].id;
                        graphEdge.target = relationship.persons[1].id;
                    } else {
                        graphEdge.source = relationship.persons[1].id;
                        graphEdge.target = relationship.persons[0].id;
                    }

                    graphData.edges.push({data: graphEdge});

                });
            }
        }
        return graphData;
    }

}
