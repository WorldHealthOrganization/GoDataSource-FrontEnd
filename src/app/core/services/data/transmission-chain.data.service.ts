import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { TransmissionChainModel } from '../../models/transmission-chain.model';
import { MetricIndependentTransmissionChainsModel } from '../../models/metrics/metric-independent-transmission-chains.model';
import { ModelHelperService } from '../helper/model-helper.service';
import { GraphNodeModel } from '../../models/graph-node.model';
import { GraphEdgeModel } from '../../models/graph-edge.model';
import { EntityType } from '../../models/entity-type';
import { Constants } from '../../models/constants';
import { I18nService } from '../helper/i18n.service';
import * as moment from 'moment';
import * as _ from 'lodash';
import { CaseModel } from '../../models/case.model';
import { LocationModel } from '../../models/location.model';

@Injectable()
export class TransmissionChainDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService,
        private i18nService: I18nService
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
     * @param colorCriteria
     * @param locationsList
     * @returns {any}
     */
    convertChainToGraphElements(chains, filters: any, colorCriteria: any, locationsList: LocationModel[]): any {
        const graphData: any = {nodes: [], edges: [], edgesHierarchical: [], caseNodesWithoutDates: [], contactNodesWithoutDates: [], eventNodesWithoutDates: []};
        let selectedNodeIds: string[] = [];
        // get labels for uears / months - age field
        const yearsLabel = this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS');
        const monthsLabel = this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS');
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
                            // set date of onset to be used in timeline
                            if (!_.isEmpty(node.model.dateOfOnset)) {
                                nodeProps.dateTimeline = node.model.dateOfOnset;
                            } else {
                                graphData.caseNodesWithoutDates.push(node.model.id);
                            }
                        } else if (node.type === EntityType.CONTACT) {
                            if (!_.isEmpty(node.model.dateOfLastContact)) {
                                nodeProps.dateTimeline = node.model.dateOfLastContact;
                            } else {
                                graphData.contactNodesWithoutDates.push(node.model.id);
                            }
                        } else if (node.type === EntityType.EVENT) {
                            if (!_.isEmpty(node.model.data)) {
                                nodeProps.dateTimeline = node.model.date;
                            } else {
                                graphData.eventNodesWithoutDates.push(node.model.id);
                            }
                        }
                        const nodeData = new GraphNodeModel(nodeProps);
                        nodeData.type = node.type;
                        // set node color
                        if (Object.keys(colorCriteria.nodeColor).length) {
                            if (colorCriteria.nodeColor[node.model[colorCriteria.nodeColorField]]) {
                                nodeData.nodeColor = colorCriteria.nodeColor[node.model[colorCriteria.nodeColorField]];
                            }
                        }
                        // set node label color
                        if (Object.keys(colorCriteria.nodeNameColor).length) {
                            if (colorCriteria.nodeNameColor[node.model[colorCriteria.nodeNameColorField]]) {
                                nodeData.nodeNameColor = colorCriteria.nodeNameColor[node.model[colorCriteria.nodeNameColorField]];
                            }
                        }
                        // set node icon
                        if (Object.keys(colorCriteria.nodeIcon).length) {
                            if ( colorCriteria.nodeIcon[node.model[colorCriteria.nodeIconField]] ) {
                                nodeData.picture = colorCriteria.nodeIcon[node.model[colorCriteria.nodeIconField]];
                            }
                        }
                        // determine label
                        if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.NAME.value) {
                            nodeData.label = nodeData.name;
                        } else if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.AGE.value) {
                            if (node.type !== EntityType.EVENT && !_.isEmpty(node.model.age)) {
                                if (node.model.age.months > 0) {
                                    nodeData.label = node.model.age.months + ' ' + monthsLabel;
                                } else {
                                    nodeData.label = node.model.age.years + ' ' + yearsLabel;
                                }
                            } else {
                                nodeData.label = '';
                            }
                        } else if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.DATE_OF_ONSET.value) {
                            if (node.type === EntityType.CASE) {
                                nodeData.label = moment(node.model.dateOfOnset).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
                            } else {
                                nodeData.label = '';
                            }
                        } else if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.GENDER.value) {
                            if (node.type !== EntityType.EVENT) {
                                nodeData.label = colorCriteria.nodeLabelValues[node.model.gender];
                            } else {
                                nodeData.label = '';
                            }
                        } else if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.LOCATION.value) {
                            nodeData.label = '';
                            if (node.type !== EntityType.EVENT) {
                                const mainAddr = node.model.mainAddress;
                                if (!_.isEmpty(mainAddr.locationId)) {
                                    const location = _.find(locationsList, function (l) {
                                        return l.id === mainAddr.locationId;
                                    });
                                    if (location) {
                                        nodeData.label = location.name;
                                    }
                                }
                            }
                        }
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
                            if (!_.isEmpty(node.model.dateOfLastContact)) {
                                nodeProps.dateTimeline = node.model.dateOfLastContact;
                            } else {
                                graphData.contactNodesWithoutDates.push(node.model.id);
                            }
                        } else if (node.type === EntityType.EVENT && filters.showEvents) {
                            allowAdd = true;
                            if (!_.isEmpty(node.model.data)) {
                                nodeProps.dateTimeline = node.model.date;
                            } else {
                                graphData.eventNodesWithoutDates.push(node.model.id);
                            }
                        } else if (node.type === EntityType.CASE) {
                            allowAdd = true;
                            if (!_.isEmpty(node.model.dateOfOnset)) {
                                nodeProps.dateTimeline = node.model.dateOfOnset;
                            } else {
                                graphData.caseNodesWithoutDates.push(node.model.id);
                            }
                        }
                        if (allowAdd) {
                            const nodeData = new GraphNodeModel(nodeProps);
                            nodeData.type = node.type;
                            // set node color
                            if (Object.keys(colorCriteria.nodeColor).length) {
                                if (colorCriteria.nodeColor[node.model[colorCriteria.nodeColorField]]) {
                                    nodeData.nodeColor = colorCriteria.nodeColor[node.model[colorCriteria.nodeColorField]];
                                }
                            }
                            // set node label color
                            if (Object.keys(colorCriteria.nodeNameColor).length) {
                                if (colorCriteria.nodeNameColor[node.model[colorCriteria.nodeNameColorField]]) {
                                    nodeData.nodeNameColor = colorCriteria.nodeNameColor[node.model[colorCriteria.nodeNameColorField]];
                                }
                            }
                            // set node icon
                            if (Object.keys(colorCriteria.nodeIcon).length) {
                                if ( colorCriteria.nodeIcon[node.model[colorCriteria.nodeIconField]] ) {
                                    nodeData.picture = colorCriteria.nodeIcon[node.model[colorCriteria.nodeIconField]];
                                }
                            }

                            // determine label
                            if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.NAME.value) {
                                nodeData.label = nodeData.name;
                            } else if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.AGE.value) {
                                if (node.type !== EntityType.EVENT && !_.isEmpty(node.model.age)) {
                                    if (node.model.age.months > 0) {
                                        nodeData.label = node.model.age.months + ' ' + monthsLabel;
                                    } else {
                                        nodeData.label = node.model.age.years + ' ' + yearsLabel;
                                    }
                                } else {
                                    nodeData.label = '';
                                }
                            } else if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.DATE_OF_ONSET.value) {
                                if (node.type === EntityType.CASE) {
                                    nodeData.label = moment(node.model.dateOfOnset).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
                                } else {
                                    nodeData.label = '';
                                }
                            } else if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.GENDER.value) {
                                if (node.type !== EntityType.EVENT) {
                                    nodeData.label = colorCriteria.nodeLabelValues[node.model.gender];
                                } else {
                                    nodeData.label = '';
                                }
                            } else if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.LOCATION.value) {
                                nodeData.label = '';
                                if (node.type !== EntityType.EVENT) {
                                    const mainAddr = node.model.mainAddress;
                                    if (!_.isEmpty(mainAddr.locationId)) {
                                        const location = _.find(locationsList, function (l) {
                                            return l.id === mainAddr.locationId;
                                        });
                                        if (location) {
                                            nodeData.label = location.name;
                                        }
                                    }
                                }
                            }
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
                        // set colors
                        if (Object.keys(colorCriteria.edgeColor).length) {
                            if (colorCriteria.edgeColor[relationship[colorCriteria.edgeColorField]]) {
                                graphEdge.edgeColor = colorCriteria.edgeColor[relationship[colorCriteria.edgeColorField]];
                            }
                        }
                        // set edge style
                        if (relationship.certaintyLevelId === Constants.CERTAINITY_LEVEL.LOW) {
                            graphEdge.edgeStyle = 'dotted';
                        } else if (relationship.certaintyLevelId === Constants.CERTAINITY_LEVEL.MEDIUM) {
                            graphEdge.edgeStyle = 'dashed';
                        } else {
                            graphEdge.edgeStyle = 'solid';
                        }

                        graphData.edges.push({data: graphEdge});
                    }
                });
            }
        }
        return graphData;
    }

}

