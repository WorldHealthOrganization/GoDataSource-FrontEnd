import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import * as _ from 'lodash';
import { TransmissionChainModel } from '../../models/transmission-chain.model';
import { MetricIndependentTransmissionChainsModel } from '../../models/metrics/metric-independent-transmission-chains.model';
import { ModelHelperService } from '../helper/model-helper.service';
import { GraphNodeModel } from '../../models/graph-node.model';
import { GraphEdgeModel } from '../../models/graph-edge.model';
import { EntityType } from '../../models/entity-type';
import { DateRangeModel } from '../../models/date-range.model';
import { Moment } from 'moment';

@Injectable()
export class TransmissionChainDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {}

    /**
     * Map Transmission chain to Chain model
     */
    private mapTransmissionChainToModel(result) {
        const nodes = _.get(result, 'nodes', {});
        const edges = _.get(result, 'edges', {});
        const transmissionChains = _.get(result, 'transmissionChains.chains', []);

        return _.map(transmissionChains, (chain) => {
            return new TransmissionChainModel(chain, nodes, Object.values(edges));
        });
    }

    /**
     * Map Transmission chain data to Chain model - we need to return the nodes even if there is no chain found
     */
    private mapTransmissionChainDataToModel(result) {
        const nodes = _.get(result, 'nodes', {});
        const edges = _.get(result, 'edges', {});
        const transmissionChains = _.get(result, 'transmissionChains.chains', []);

        if (_.isEmpty(transmissionChains)) {
            return [new TransmissionChainModel({}, nodes, Object.values(edges))];
        }

        return _.map(transmissionChains, (chain) => {
            return new TransmissionChainModel(chain, nodes, Object.values(edges));
        });
    }

    /**
     * Retrieve the list of Independent Transmission Chains, nodes, edges
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<TransmissionChainModel[]>}
     */
    getIndependentTransmissionChainData(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<TransmissionChainModel[]> {
        const filter = queryBuilder.filter.generateFirstCondition(true, false);
        return this.http.get(
            `outbreaks/${outbreakId}/relationships/independent-transmission-chains?filter=${filter}`
        ).map(this.mapTransmissionChainDataToModel);
    }

    /**
     * Retrieve the list of Independent Transmission Chains
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<TransmissionChainModel[]>}
     */
    getIndependentTransmissionChainsList(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<TransmissionChainModel[]> {

        const filter = queryBuilder.buildQuery();

        return this.http.get(
            `outbreaks/${outbreakId}/relationships/independent-transmission-chains?filter=${filter}`
        ).map(this.mapTransmissionChainToModel);
    }


    /**
     * Retrieve the list of New Transmission Chains from contacts who became cases
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<TransmissionChainModel[]>}
     */
    getTransmissionChainsFromContactsWhoBecameCasesList(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<TransmissionChainModel[]> {

        const filter = queryBuilder.buildQuery();

        return this.http.get(
            `outbreaks/${outbreakId}/relationships/new-transmission-chains-from-registered-contacts-who-became-cases?filter=${filter}`
        ).map(this.mapTransmissionChainToModel);
    }

    /**
     * Get length of independent transmission chains
     * @param {string} outbreakId
     * @returns {Observable<MetricIndependentTransmissionChainsModel>}
     */
    getCountIndependentTransmissionChains(outbreakId: string): Observable<MetricIndependentTransmissionChainsModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/relationships/independent-transmission-chains/filtered-count`),
            MetricIndependentTransmissionChainsModel
        );
    }

    /**
     * Get the number of new chains of transmission from registered contacts who became cases
     * @param {string} outbreakId
     * @returns {Observable<MetricIndependentTransmissionChainsModel>}
     */
    getCountNewChainsOfTransmissionFromRegContactsWhoBecameCase(outbreakId: string): Observable<MetricIndependentTransmissionChainsModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`/outbreaks/${outbreakId}/relationships/new-transmission-chains-from-registered-contacts-who-became-cases/filtered-count`),
            MetricIndependentTransmissionChainsModel);
    }

    /**
     * convert transmission chain model to the format needed by the graph
     * @param chains
     * @param filters
     * @returns {any}
     */
    convertChainToGraphElements(chains, filters: any): any {
        const graphData: any = {nodes: [], edges: [], edgesHierarchical: []};
        let selectedNodeIds: string[] = [];
        if (!_.isEmpty(chains)) {
            // will use firstChainData to load all the nodes
            const firstChain = chains[0];
            // if show contacts and show events filters are not checked then only look into chainRelations for cases / events - faster lookup
            if (filters.filtersDefault) {
                // loop through the list of relations from all chains
                _.forEach(chains, (chain, chainKey) => {
                    if (!_.isEmpty(chain.chainRelations)) {
                        _.forEach(chain.chainRelations, (relation, key) => {
                            selectedNodeIds.push(relation.entityIds[0]);
                            selectedNodeIds.push(relation.entityIds[1]);
                        });
                    }
                });
                selectedNodeIds = _.uniq(selectedNodeIds);
                // load the data for all selected nodes
                _.forEach(selectedNodeIds, (nodeId, key) => {
                    const node = firstChain.nodes[nodeId];
                    if (node) {
                        const nodeProps = node.model;
                        // calculate dateTimeline value
                        if (node.type === EntityType.CASE) {
                            // get earliest hospitalization dates if any
                            let datesArray = [];
                            if (!_.isEmpty(node.model.hospitalizationDates)) {
                                _.forEach(node.model.hospitalizationDates, (hospitalDate: DateRangeModel, hospitalDateKey) => {
                                    datesArray.push(hospitalDate.startDate);
                                });
                            }
                            if (!_.isEmpty(node.model.dateOfOnset)) {
                                datesArray.push(node.model.dateOfOnset);
                            }
                            datesArray = _.sortBy(datesArray);
                            if (!_.isEmpty(datesArray)) {
                                nodeProps.dateTimeline = datesArray[0];
                            }
                        } else if (node.type === EntityType.CONTACT) {
                            nodeProps.dateTimeline = node.model.dateOfReporting;
                        } else if (node.type === EntityType.EVENT) {
                            nodeProps.dateTimeline = node.model.date;
                        }
                        const nodeData = new GraphNodeModel(nodeProps);
                        nodeData.type = node.type;
                        graphData.nodes.push({data: nodeData});
                    }
                });
            } else {
                // if show contacts filter is checked or show events is not checked, then look into all the nodes - don't rely on chainRelations
                if (!_.isEmpty(firstChain.nodes)) {
                    _.forEach(firstChain.nodes, function (node, key) {
                        let allowAdd = false;
                        const nodeProps = node.model;
                        // show nodes based on their type
                        if (node.type === EntityType.CONTACT && filters.showContacts) {
                            allowAdd = true;
                            nodeProps.dateTimeline = node.model.dateOfReporting;
                        } else if (node.type === EntityType.EVENT && filters.showEvents) {
                            allowAdd = true;
                            nodeProps.dateTimeline = node.model.date;
                        } else if (node.type === EntityType.CASE) {
                            allowAdd = true;
                            // get earliest hospitalization dates if any
                            let datesArray = [];
                            if (!_.isEmpty(node.model.hospitalizationDates)) {
                                _.forEach(node.model.hospitalizationDates, (hospitalDate: DateRangeModel, hospitalDateKey) => {
                                    datesArray.push(hospitalDate.startDate);
                                });
                            }
                            if (!_.isEmpty(node.model.dateOfOnset)) {
                                datesArray.push(node.model.dateOfOnset);
                            }
                            datesArray = _.sortBy(datesArray);
                            if (!_.isEmpty(datesArray)) {
                                nodeProps.dateTimeline = datesArray[0];
                            }
                        }
                        if (allowAdd) {
                            const nodeData = new GraphNodeModel(nodeProps);
                            nodeData.type = node.type;
                            graphData.nodes.push({data: nodeData});
                            selectedNodeIds.push(nodeData.id);
                        }
                    });
                }
            }

            // generate edges based on the nodes included in the graph
            if (!_.isEmpty(firstChain.relationships)) {
                _.forEach(firstChain.relationships, function (relationship, key) {
                    // add relation only if the nodes are in the selectedNodes array
                    if (_.includes(selectedNodeIds, relationship.persons[0].id) && _.includes(selectedNodeIds, relationship.persons[1].id)) {
                        const graphEdge = new GraphEdgeModel();
                        graphEdge.id = relationship.id;
                        if (relationship.persons[0].source) {
                            graphEdge.source = relationship.persons[0].id;
                            graphEdge.sourceType = relationship.persons[0].type;
                            graphEdge.target = relationship.persons[1].id;
                            graphEdge.targetType = relationship.persons[1].type;
                        } else {
                            graphEdge.source = relationship.persons[1].id;
                            graphEdge.sourceType = relationship.persons[1].type;
                            graphEdge.target = relationship.persons[0].id;
                            graphEdge.targetType = relationship.persons[0].type;
                        }
                        // set the edge color based on the type of the source and target
                        graphEdge.setEdgeColor();
                        graphData.edges.push({data: graphEdge});
                    }
                });
            }
        }
        return graphData;
    }
}

