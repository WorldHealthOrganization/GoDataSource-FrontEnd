import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { TransmissionChainModel } from '../../models/transmission-chain.model';
import { MetricIndependentTransmissionChainsModel } from '../../models/metrics/metric-independent-transmission-chains.model';
import { ModelHelperService } from '../helper/model-helper.service';
import { GraphNodeModel } from '../../models/graph-node.model';
import { GraphEdgeModel } from '../../models/graph-edge.model';
import { EntityType } from '../../models/entity-type';
import { Constants } from '../../models/constants';
import { I18nService } from '../helper/i18n.service';
import * as _ from 'lodash';
import { LocationModel } from '../../models/location.model';
import { FilteredRequestCache } from '../../helperClasses/filtered-request-cache';
import { map } from 'rxjs/operators';
import { moment } from '../../helperClasses/x-moment';

export interface IConvertChainToGraphElements {
    nodes: {
        data: GraphNodeModel
    }[];
    edges: {
        data: GraphEdgeModel
    }[];
    edgesHierarchical: any[];
    caseNodesWithoutDates: any[];
    contactNodesWithoutDates: any[];
    eventNodesWithoutDates: any[];
    timelineDateCheckpoints: any[];
}

@Injectable()
export class TransmissionChainDataService {
    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService,
        private i18nService: I18nService
    ) {
    }

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
        // generate filter
        const filter = queryBuilder.buildQuery();
        return this.http.get(
            `outbreaks/${outbreakId}/relationships/independent-transmission-chains?filter=${filter}`
        )
            .pipe(
                map(this.mapTransmissionChainDataToModel)
            );
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
        )
            .pipe(
                map(this.mapTransmissionChainToModel)
            );
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
        )
            .pipe(
                map(this.mapTransmissionChainToModel)
            );
    }

    /**
     * Get length of independent transmission chains
     * @param {string} outbreakId
     * @param queryBuilder
     * @returns {Observable<MetricIndependentTransmissionChainsModel>}
     */
    getCountIndependentTransmissionChains(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<MetricIndependentTransmissionChainsModel> {
        // construct query
        const filter = queryBuilder.buildQuery();

        // check if we didn't create a request already
        return FilteredRequestCache.get(
            'getCountIndependentTransmissionChains',
            filter,
            () => {
                return this.modelHelper.mapObservableToModel(
                    this.http.get(`outbreaks/${outbreakId}/relationships/independent-transmission-chains/filtered-count?filter=${filter}`),
                    MetricIndependentTransmissionChainsModel
                );
            }
        );
    }

    /**
     * Get the number of new chains of transmission from registered contacts who became cases
     * @param {string} outbreakId
     * @param queryBuilder
     * @returns {Observable<MetricIndependentTransmissionChainsModel>}
     */
    getCountNewChainsOfTransmissionFromRegContactsWhoBecameCase(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<MetricIndependentTransmissionChainsModel> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableToModel(
            this.http.get(`/outbreaks/${outbreakId}/relationships/new-transmission-chains-from-registered-contacts-who-became-cases/filtered-count?filter=${filter}`),
            MetricIndependentTransmissionChainsModel
        );
    }

    /**
     * convert transmission chain model to the format needed by the graph
     * @param chains
     * @param filters
     * @param colorCriteria
     * @param locationsList
     * @param selectedViewType
     * @returns {any}
     */
    convertChainToGraphElements(
        chains,
        filters: any,
        colorCriteria: any,
        locationsList: LocationModel[],
        selectedViewType: string = Constants.TRANSMISSION_CHAIN_VIEW_TYPES.BUBBLE_NETWORK.value
    ): IConvertChainToGraphElements {
        const graphData: IConvertChainToGraphElements = {
            nodes: [],
            edges: [],
            edgesHierarchical: [],
            caseNodesWithoutDates: [],
            contactNodesWithoutDates: [],
            eventNodesWithoutDates: [],
            timelineDateCheckpoints: []
        };

        const locationsListMap = {};
        // build locations list map for further use
        if (!_.isEmpty(locationsList)) {
            locationsList.forEach((loc) => {
                locationsListMap[loc.id] = loc;
            });
        }
        const selectedNodeIds: string[] = [];
        // get labels for years / months - age field
        const yearsLabel = this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS');
        const monthsLabel = this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS');

        let minTimelineDate: string = '';
        let maxTimelineDate: string = '';

        const onsetLabel = this.i18nService.instant('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ONSET_LABEL');
        const onsetApproximateLabel = this.i18nService.instant('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ONSET_APRROXIMATE_LABEL');

        if (!_.isEmpty(chains)) {
            // will use firstChainData to load all the nodes
            const firstChain = chains[0];
            if (!_.isEmpty(firstChain.nodes)) {
                _.forEach(firstChain.nodes, (node) => {
                    let allowAdd = false;
                    const nodeProps = node.model;
                    // show nodes based on their type
                    if (node.type === EntityType.CONTACT && filters.showContacts) {
                        allowAdd = true;
                        if (selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value
                            || selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value) {
                            if (!_.isEmpty(node.model.dateOfLastContact)) {
                                nodeProps.dateTimeline = node.model.dateOfLastContact;
                            } else {
                                graphData.contactNodesWithoutDates.push(node.model.id);
                            }
                        } else if (selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value) {
                            if (!_.isEmpty(node.model.dateOfReporting)) {
                                nodeProps.dateTimeline = node.model.dateOfReporting;
                            } else {
                                graphData.contactNodesWithoutDates.push(node.model.id);
                            }
                        } else {
                            nodeProps.dateTimeline = null;
                        }
                    } else if (node.type === EntityType.EVENT && filters.showEvents) {
                        allowAdd = true;
                        if (selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value
                            || selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value) {
                            if (!_.isEmpty(node.model.date)) {
                                nodeProps.dateTimeline = node.model.date;
                            } else {
                                graphData.eventNodesWithoutDates.push(node.model.id);
                            }
                        } else if (selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value) {
                            if (!_.isEmpty(node.model.dateOfReporting)) {
                                nodeProps.dateTimeline = node.model.dateOfReporting;
                            } else {
                                graphData.eventNodesWithoutDates.push(node.model.id);
                            }
                        } else {
                            nodeProps.dateTimeline = null;
                        }
                    } else if (node.type === EntityType.CASE) {
                        allowAdd = true;
                        if (selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value) {
                            if (!_.isEmpty(node.model.dateOfOnset)) {
                                nodeProps.dateTimeline = node.model.dateOfOnset;
                            } else {
                                graphData.caseNodesWithoutDates.push(node.model.id);
                            }
                        } else if (selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value) {
                            if (!_.isEmpty(node.model.dateOfLastContact)) {
                                nodeProps.dateTimeline = node.model.dateOfLastContact;
                            } else {
                                graphData.caseNodesWithoutDates.push(node.model.id);
                            }
                        } else if (selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value) {
                            if (!_.isEmpty(node.model.dateOfReporting)) {
                                nodeProps.dateTimeline = node.model.dateOfReporting;
                            } else {
                                graphData.caseNodesWithoutDates.push(node.model.id);
                            }
                        } else {
                            nodeProps.dateTimeline = null;
                        }
                    }
                    if (allowAdd) {
                        const nodeData = new GraphNodeModel(nodeProps);
                        nodeData.type = node.type;
                        // set node color
                        if (!_.isEmpty(colorCriteria.nodeColor)) {
                            if (colorCriteria.nodeColor[node.model[colorCriteria.nodeColorField]]) {
                                nodeData.nodeColor = colorCriteria.nodeColor[node.model[colorCriteria.nodeColorField]];
                            }
                        }
                        // set node label color
                        if (!_.isEmpty(colorCriteria.nodeNameColor)) {
                            if (colorCriteria.nodeNameColor[node.model[colorCriteria.nodeNameColorField]]) {
                                nodeData.nodeNameColor = colorCriteria.nodeNameColor[node.model[colorCriteria.nodeNameColorField]];
                            }
                        }
                        // set node icon
                        if (!_.isEmpty(colorCriteria.nodeIcon)) {
                            if (colorCriteria.nodeIcon[node.model[colorCriteria.nodeIconField]]) {
                                nodeData.picture = colorCriteria.nodeIcon[node.model[colorCriteria.nodeIconField]];
                            }
                        }
                        // set node shape
                        if (!_.isEmpty(colorCriteria.nodeShape)) {

                            if (colorCriteria.nodeShapeField === Constants.TRANSMISSION_CHAIN_NODE_SHAPE_CRITERIA_OPTIONS.TYPE.value) {
                                nodeData.setNodeShapeType(node);
                            } else if (colorCriteria.nodeShapeField === Constants.TRANSMISSION_CHAIN_NODE_SHAPE_CRITERIA_OPTIONS.CLASSIFICATION.value) {
                                nodeData.setNodeShapeClassification(node);
                            }
                        }
                        // determine label
                        // name
                        if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.NAME.value) {
                            nodeData.label = nodeData.name;
                            // age
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
                            // date of onset and event date
                        } else if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.DATE_OF_ONSET_AND_EVENT_DATE.value) {
                            if (node.type === EntityType.EVENT &&
                                node.model.date
                            ) {
                                nodeData.label = moment(node.model.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
                            }
                            if (
                                node.type === EntityType.CASE &&
                                node.model.dateOfOnset
                            ) {
                                nodeData.label = moment(node.model.dateOfOnset).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
                            }
                            // gender
                        } else if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.GENDER.value) {
                            if (node.type !== EntityType.EVENT) {
                                nodeData.label = colorCriteria.nodeLabelValues[node.model.gender];
                            } else {
                                nodeData.label = '';
                            }
                            // occupation
                        } else if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.OCCUPATION.value) {
                            if (node.type !== EntityType.EVENT) {
                                nodeData.label = colorCriteria.nodeLabelValues[node.model.occupation];
                            } else {
                                nodeData.label = '';
                            }
                            // location
                        } else if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.LOCATION.value) {
                            nodeData.label = '';
                            if (node.type !== EntityType.EVENT) {
                                const mainAddr = node.model.mainAddress;
                                if (
                                    mainAddr &&
                                    mainAddr.locationId &&
                                    locationsListMap[mainAddr.locationId] &&
                                    locationsListMap[mainAddr.locationId].name
                                ) {
                                    nodeData.label = locationsListMap[mainAddr.locationId].name;
                                }
                            }
                            // initials
                        } else if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.INITIALS.value) {
                            if (node.type !== EntityType.EVENT) {
                                const firstNameInitial = (!_.isEmpty(node.model.firstName)) ? node.model.firstName.slice(0, 1) : '';
                                const lastNameInitial = (!_.isEmpty(node.model.lastName)) ? node.model.lastName.slice(0, 1) : '';
                                nodeData.label = lastNameInitial + ' ' + firstNameInitial;
                            } else {
                                nodeData.label = '';
                            }
                            // visual id
                        } else if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.VISUAL_ID.value) {
                            if (node.type !== EntityType.EVENT) {
                                nodeData.label = node.model.visualId;
                            } else {
                                nodeData.label = '';
                            }
                            // visual id and location
                        } else if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.ID_AND_LOCATION.value) {
                            if (node.type !== EntityType.EVENT) {
                                if (node.model.visualId) {
                                    nodeData.label = node.model.visualId;
                                }
                                const mainAddr = node.model.mainAddress;
                                if (
                                    mainAddr &&
                                    mainAddr.locationId &&
                                    locationsListMap[mainAddr.locationId] &&
                                    locationsListMap[mainAddr.locationId].name
                                ) {
                                    nodeData.label = (node.model.visualId ? nodeData.label + ' - ' : '') + locationsListMap[mainAddr.locationId].name;
                                }
                            } else {
                                nodeData.label = '';
                            }
                            // concatenated details
                        } else if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.CONCATENATED_DETAILS.value) {
                            if (node.type !== EntityType.EVENT) {
                                const lastName = node.model.lastName ? node.model.lastName : '';
                                const firstName = node.model.firstName ? node.model.firstName : '';
                                const gender = colorCriteria.genderValues[node.model.gender] ? colorCriteria.genderValues[node.model.gender] : '';
                                const outcome = colorCriteria.outcomeValues[node.model.outcomeId] ? colorCriteria.outcomeValues[node.model.outcomeId] : '';
                                const visualId = node.model.visualId ? '\n' + node.model.visualId : '';
                                const age = !_.isEmpty(node.model.age) ?
                                    node.model.age.months > 0 ?
                                        node.model.age.months + ' ' + monthsLabel :
                                        node.model.age.years + ' ' + yearsLabel
                                    : '';
                                const classification = colorCriteria.classificationValues[node.model.classification] && node.type === EntityType.CASE ?
                                    '\n' + colorCriteria.classificationValues[node.model.classification] :
                                    '';
                                const mainAddr = node.model.mainAddress;
                                let locationName = '';
                                if (!_.isEmpty(mainAddr.locationId)) {
                                    const location = _.find(locationsList, function (l) {
                                        return l.id === mainAddr.locationId;
                                    });
                                    if (location) {
                                        locationName = '\n' + location.name;
                                    }
                                }
                                const onset = !_.isEmpty(node.model.dateOfOnset) && node.type === EntityType.CASE ?
                                    '\n' + onsetLabel + ' ' + moment(node.model.dateOfOnset).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) + (node.model.isDateOfOnsetApproximate ? onsetApproximateLabel : '') :
                                    '';
                                // concatenate results
                                nodeData.label = lastName + ' ' + firstName + visualId + '\n' + age + ' - ' + gender + classification + '\n' + outcome + locationName + onset;
                            } else {
                                nodeData.label = '';
                            }
                        }

                        // check min / max dates
                        if (!_.isEmpty(nodeData.dateTimeline)) {
                            if (moment(nodeData.dateTimeline).isAfter(maxTimelineDate) || _.isEmpty(maxTimelineDate)) {
                                maxTimelineDate = nodeData.dateTimeline;
                            }
                            if (moment(nodeData.dateTimeline).isBefore(minTimelineDate) || _.isEmpty(minTimelineDate)) {
                                minTimelineDate = nodeData.dateTimeline;
                            }
                        }
                        graphData.nodes.push({data: nodeData});
                        selectedNodeIds.push(nodeData.id);
                    }
                });

                // generate checkpoint nodes
                graphData.timelineDateCheckpoints = [];
                const counterDate = moment(minTimelineDate);
                counterDate.subtract(1, 'days');
                graphData.timelineDateCheckpoints.push(counterDate.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT));
                while (counterDate.isBefore(moment(maxTimelineDate))) {
                    counterDate.add(1, 'days');
                    const counterDateFormatted = counterDate.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
                    graphData.timelineDateCheckpoints.push(counterDateFormatted);
                    // generate node
                    const checkpointNode = new GraphNodeModel({
                        dateTimeline: counterDateFormatted,
                        id: counterDateFormatted,
                        name: counterDateFormatted,
                        nodeType: 'checkpoint'
                    });
                    graphData.nodes.push({data: checkpointNode});
                }
                graphData.timelineDateCheckpoints.push(counterDate.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT));
            }

            // generate edges based on the nodes included in the graph
            if (!_.isEmpty(firstChain.relationships)) {
                _.forEach(firstChain.relationships, (relationship, key) => {
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
                        if (!_.isEmpty(colorCriteria.edgeColor)) {
                            if (colorCriteria.edgeColor[relationship[colorCriteria.edgeColorField]]) {
                                graphEdge.edgeColor = colorCriteria.edgeColor[relationship[colorCriteria.edgeColorField]];
                            }
                        }
                        // set edge style
                        graphEdge.setEdgeStyle(relationship);

                        // set edge label
                        if (colorCriteria.edgeLabelField === Constants.TRANSMISSION_CHAIN_EDGE_LABEL_CRITERIA_OPTIONS.NONE.value) {
                            graphEdge.label = '';
                        } else if (colorCriteria.edgeLabelField === Constants.TRANSMISSION_CHAIN_EDGE_LABEL_CRITERIA_OPTIONS.SOCIAL_RELATIONSHIP_TYPE.value) {
                            // translate values
                            graphEdge.label = colorCriteria.edgeLabelContextTransmissionEntries[relationship.socialRelationshipTypeId];
                        } else if (colorCriteria.edgeLabelField === Constants.TRANSMISSION_CHAIN_EDGE_LABEL_CRITERIA_OPTIONS.SOCIAL_RELATIONSHIP_LEVEL.value) {
                            graphEdge.label = relationship.socialRelationshipDetail;
                        } else if (colorCriteria.edgeLabelField === Constants.TRANSMISSION_CHAIN_EDGE_LABEL_CRITERIA_OPTIONS.CLUSTER_NAME.value) {
                            graphEdge.label = colorCriteria.clustersList[relationship.clusterId];
                        } else if (colorCriteria.edgeLabelField === Constants.TRANSMISSION_CHAIN_EDGE_LABEL_CRITERIA_OPTIONS.DAYS_DAYE_ONSET_LAST_CONTACT.value) {
                            // calculate difference in dates between the dates of onset or dates of onset and last contact.
                            const sourceNode = firstChain.nodes[graphEdge.source];
                            const targetNode = firstChain.nodes[graphEdge.target];
                            let noDays = 0;
                            let sourceDate = '';
                            let targetDate = '';
                            if (sourceNode.type === EntityType.CASE) {
                                if (!_.isEmpty(sourceNode.model.dateOfOnset)) {
                                    sourceDate = sourceNode.model.dateOfOnset;
                                }
                            } else if (sourceNode.type === EntityType.CONTACT) {
                                if (!_.isEmpty(relationship.contactDate)) {
                                    sourceDate = relationship.contactDate;
                                }
                            } else if (sourceNode.type === EntityType.EVENT) {
                                if (!_.isEmpty(sourceNode.model.date)) {
                                    sourceDate = sourceNode.model.date;
                                }
                            }

                            if (targetNode.type === EntityType.CASE) {
                                if (!_.isEmpty(targetNode.model.dateOfOnset)) {
                                    targetDate = targetNode.model.dateOfOnset;
                                }
                            } else if (targetNode.type === EntityType.CONTACT) {
                                if (!_.isEmpty(relationship.contactDate)) {
                                    targetDate = relationship.contactDate;
                                }
                            } else if (targetNode.type === EntityType.EVENT) {
                                if (!_.isEmpty(targetNode.model.date)) {
                                    targetDate = targetNode.model.date;
                                }
                            }

                            if (!_.isEmpty(sourceDate) && !_.isEmpty(targetDate)) {
                                const momentTargetDate = moment(targetDate, Constants.DEFAULT_DATE_DISPLAY_FORMAT);
                                const momentSourceDate = moment(sourceDate, Constants.DEFAULT_DATE_DISPLAY_FORMAT);
                                noDays = Math.round(moment.duration(momentTargetDate.diff(momentSourceDate)).asDays());
                                graphEdge.label = String(noDays);
                            }
                        }

                        // set edge icon
                        if (colorCriteria.edgeIconField === Constants.TRANSMISSION_CHAIN_EDGE_ICON_CRITERIA_OPTIONS.SOCIAL_RELATIONSHIP_TYPE.value) {
                            graphEdge.setEdgeIconContextOfTransmission(relationship);
                            graphEdge.fontFamily = 'xtIcon';

                        } else if (colorCriteria.edgeIconField === Constants.TRANSMISSION_CHAIN_EDGE_ICON_CRITERIA_OPTIONS.EXPOSURE_TYPE.value) {
                            graphEdge.setEdgeIconExposureType(relationship);
                            graphEdge.fontFamily = 'xtIcon';
                        }

                        graphData.edges.push({data: graphEdge});
                    }
                });
            }
        }
        return graphData;
    }

}

