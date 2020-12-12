import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { ITransmissionChainGroupPageModel, TransmissionChainGroupModel } from '../../models/transmission-chain.model';
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
import { catchError, map } from 'rxjs/operators';
import { moment } from '../../helperClasses/x-moment';
import { ContactModel } from '../../models/contact.model';
import { ContactOfContactModel } from '../../models/contact-of-contact.model';
import { EventModel } from '../../models/event.model';
import { CotSnapshotModel } from '../../models/cot-snapshot.model';
import { CaseModel } from '../../models/case.model';
import { IBasicCount } from '../../models/basic-count.interface';
import { FileSize } from '../../helperClasses/file-size';

export interface IConvertChainToGraphElements {
    nodes: {
        data: GraphNodeModel
    }[];
    edges: {
        data: GraphEdgeModel
    }[];
    caseNodesWithoutDates: any[];
    contactNodesWithoutDates: any[];
    eventNodesWithoutDates: any[];
}

@Injectable()
export class TransmissionChainDataService {
    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService,
        private i18nService: I18nService
    ) {}

    /**
     * Map Transmission chain data to Chain model - we need to return the nodes even if there is no chain found
     */
    private mapTransmissionChainDataToModel(result): TransmissionChainGroupModel {
        // retrieve chain data
        const nodes = _.get(result, 'nodes', {});
        const edges = _.get(result, 'edges', {});
        const transmissionChains = _.get(result, 'transmissionChains.chains', []);

        // create chain group
        return new TransmissionChainGroupModel(
            nodes,
            edges,
            transmissionChains
        );
    }

    /**
     * Retrieve the list of Independent Transmission Chains, nodes, edges
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<TransmissionChainGroupModel>}
     */
    getIndependentTransmissionChainData(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<TransmissionChainGroupModel> {
        // generate filter
        const filter = queryBuilder.buildQuery();
        return this.http
            .get(`outbreaks/${outbreakId}/relationships/independent-transmission-chains?filter=${filter}`)
            .pipe(
                map(this.mapTransmissionChainDataToModel),
            );
    }

    /**
     * Retrieve the list of New Transmission Chains from contacts who became cases
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<TransmissionChainGroupModel>}
     */
    getTransmissionChainsFromContactsWhoBecameCasesList(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<TransmissionChainGroupModel> {
        const filter = queryBuilder.buildQuery();
        return this.http
            .get(`outbreaks/${outbreakId}/relationships/new-transmission-chains-from-registered-contacts-who-became-cases?filter=${filter}`)
            .pipe(
                map(this.mapTransmissionChainDataToModel)
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
     * Retrieve chain of transmission pages
     */
    getChainOfTransmissionPages(
        chainGroup: TransmissionChainGroupModel,
        pageSize: number
    ): ITransmissionChainGroupPageModel[] {
        // if bubble graph we must split it into multiple pages
        // #TODO this should be integrated in the code bellow so we don't do again the logic that was done once...but that would mean that we need to rewrite some of the logic, which might cause other issues
        // #TODO so until we rewrite the graph component there is no point in stressing out that much with this since we will have to rewrite this entire function since it was written like ...
        // sort chains by size descending
        chainGroup.chains.sort((chain1, chain2) => {
            return chain2.chainRelations.length - chain1.chainRelations.length;
        });

        // go through edges and map them to determine isolated nodes
        const entitiesThatHaveEdges: {
            [entityId: string]: true
        } = {};
        chainGroup.relationships.forEach((rel) => {
            rel.persons.forEach((relPerson) => {
                entitiesThatHaveEdges[relPerson.id] = true;
            });
        });

        // determine isolated nodes
        const isolatedNodes: string[] = [];
        Object.keys(chainGroup.nodesMap).forEach((entityId) => {
            // entity has relationship ?
            if (entitiesThatHaveEdges[entityId]) {
                return;
            }

            // isolated node
            isolatedNodes.push(entityId);
        });

        // construct pages
        const pages: ITransmissionChainGroupPageModel[] = [];
        let currentPageIndex: number;
        (chainGroup.chains || []).forEach((chain, chainIndex) => {
            // add new page ?
            currentPageIndex = pages.length - 1;
            if (
                pages.length < 1 ||
                pages[currentPageIndex].totalSize + chain.chainRelations.length > pageSize
            ) {
                // add next page
                pages.push({
                    chains: [chainIndex],
                    isolatedNodes: null,
                    totalSize: chain.chainRelations.length,
                    pageIndex: pages.length,
                    pageLabel: (pages.length + 1).toString()
                });
            } else {
                // increase total size of page
                pages[currentPageIndex].totalSize += chain.chainRelations.length;

                // add chain to the page list
                pages[currentPageIndex].chains.push(chainIndex);
            }
        });

        // fill out current page with isolated nodes
        currentPageIndex = pages.length - 1;
        if (
            currentPageIndex > -1 &&
            pages[currentPageIndex].totalSize < pageSize
        ) {
            const size: number = pageSize - pages[currentPageIndex].totalSize;
            pages[currentPageIndex].totalSize += size;
            pages[currentPageIndex].isolatedNodes = isolatedNodes.splice(0, size);
        }

        // create pages from isolated nodes
        while (isolatedNodes.length > 0) {
            // split isolated nodes
            const nodes = isolatedNodes.splice(0, pageSize);
            pages.push({
                chains: null,
                isolatedNodes: nodes,
                totalSize: nodes.length,
                pageIndex: pages.length,
                pageLabel: (pages.length + 1).toString()
            });
        }

        // finished
        return pages;
    }

    /**
     * Convert transmission chain model to the format needed by the graph
     */
    convertChainToGraphElements(
        chainGroup: TransmissionChainGroupModel,
        filters: {
            showEvents?: boolean,
            showContacts?: boolean,
            showContactsOfContacts?: boolean
        },
        colorCriteria: any,
        locationsListMap: {
            [idLocation: string]: LocationModel
        },
        selectedViewType: string,
        page: ITransmissionChainGroupPageModel,
        clusterIconMap: {
            [clusterId: string]: string
        }
    ): IConvertChainToGraphElements {
        // if we have a pge then we must limit nodes to the specific items
        const pageAllowedNodes: {
            [nodeId: string]: true
        } = {};
        if (page) {
            // go through chains
            (page.chains || []).forEach((chainIndex) => {
                chainGroup.chains[chainIndex].chainRelations.forEach((rel) => {
                    rel.entityIds.forEach((entityId: string) => {
                        pageAllowedNodes[entityId] = true;
                    });
                });
            });

            // go through isolated nodes
            (page.isolatedNodes || []).forEach((entityId) => {
                pageAllowedNodes[entityId] = true;
            });
        }

        // render data
        const graphData: IConvertChainToGraphElements = {
            nodes: [],
            edges: [],
            caseNodesWithoutDates: [],
            contactNodesWithoutDates: [],
            eventNodesWithoutDates: []
        };

        const selectedNodeIds: {
            [idPerson: string]: true
        } = {};

        // get labels for years / months - age field
        const yearsLabel = this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS');
        const monthsLabel = this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS');

        let minTimelineDate: string = '';
        let maxTimelineDate: string = '';

        const onsetLabel = this.i18nService.instant('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ONSET_LABEL');
        const onsetApproximateLabel = this.i18nService.instant('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ONSET_APRROXIMATE_LABEL');

        // will use firstChainData to load all the nodes
        if (!_.isEmpty(chainGroup.nodesMap)) {
            _.forEach(chainGroup.nodesMap, (node) => {
                // prepare node
                let allowAdd = false;
                const nodeProps: any = node.model;

                // don't render node
                if (!pageAllowedNodes[node.model.id]) {
                    return;
                }

                // show nodes based on their type
                if (
                    node.type === EntityType.CONTACT &&
                    filters.showContacts
                ) {
                    const contactData: ContactModel = node.model as ContactModel;
                    allowAdd = true;
                    if (
                        selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value ||
                        selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value
                    ) {
                        if (contactData.dateOfLastContact) {
                            nodeProps.dateTimeline = contactData.dateOfLastContact;
                        } else {
                            graphData.contactNodesWithoutDates.push(contactData.id);
                        }
                    } else if (selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value) {
                        if (contactData.dateOfReporting) {
                            nodeProps.dateTimeline = contactData.dateOfReporting;
                        } else {
                            graphData.contactNodesWithoutDates.push(contactData.id);
                        }
                    } else {
                        nodeProps.dateTimeline = null;
                    }
                } else if (
                    node.type === EntityType.CONTACT_OF_CONTACT &&
                    filters.showContacts && filters.showContactsOfContacts
                ) {
                    const contactOfContactData: ContactOfContactModel = node.model as ContactOfContactModel;
                    allowAdd = true;
                    if (
                        selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value ||
                        selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value
                    ) {
                        if (contactOfContactData.dateOfLastContact) {
                            nodeProps.dateTimeline = contactOfContactData.dateOfLastContact;
                        } else {
                            graphData.contactNodesWithoutDates.push(contactOfContactData.id);
                        }
                    } else if (selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value) {
                        if (contactOfContactData.dateOfReporting) {
                            nodeProps.dateTimeline = contactOfContactData.dateOfReporting;
                        } else {
                            graphData.contactNodesWithoutDates.push(contactOfContactData.id);
                        }
                    } else {
                        nodeProps.dateTimeline = null;
                    }
                } else if (
                    node.type === EntityType.EVENT &&
                    filters.showEvents
                ) {
                    const eventData: EventModel = node.model as EventModel;
                    allowAdd = true;
                    if (
                        selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value ||
                        selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value
                    ) {
                        if (eventData.date) {
                            nodeProps.dateTimeline = eventData.date;
                        } else {
                            graphData.eventNodesWithoutDates.push(eventData.id);
                        }
                    } else if (selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value) {
                        if (eventData.dateOfReporting) {
                            nodeProps.dateTimeline = eventData.dateOfReporting;
                        } else {
                            graphData.eventNodesWithoutDates.push(eventData.id);
                        }
                    } else {
                        nodeProps.dateTimeline = null;
                    }
                } else if (node.type === EntityType.CASE) {
                    const caseData: CaseModel = node.model as CaseModel;
                    allowAdd = true;
                    if (selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK.value) {
                        if (caseData.dateOfOnset) {
                            nodeProps.dateTimeline = caseData.dateOfOnset;
                        } else {
                            graphData.caseNodesWithoutDates.push(caseData.id);
                        }
                    } else if (selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_LAST_CONTACT.value) {
                        if (caseData.dateOfLastContact) {
                            nodeProps.dateTimeline = caseData.dateOfLastContact;
                        } else {
                            graphData.caseNodesWithoutDates.push(caseData.id);
                        }
                    } else if (selectedViewType === Constants.TRANSMISSION_CHAIN_VIEW_TYPES.TIMELINE_NETWORK_REPORTING.value) {
                        if (caseData.dateOfReporting) {
                            nodeProps.dateTimeline = caseData.dateOfReporting;
                        } else {
                            graphData.caseNodesWithoutDates.push(caseData.id);
                        }
                    } else {
                        nodeProps.dateTimeline = null;
                    }
                }

                // can add ?
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
                        if (
                            node.type !== EntityType.EVENT &&
                            !(node.model instanceof EventModel) &&
                            !_.isEmpty(node.model.age)
                        ) {
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
                        if (
                            node.type === EntityType.EVENT &&
                            node.model instanceof EventModel &&
                            node.model.date
                        ) {
                            nodeData.label = moment(node.model.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
                        }
                        if (
                            node.type === EntityType.CASE &&
                            node.model instanceof CaseModel &&
                            node.model.dateOfOnset
                        ) {
                            nodeData.label = moment(node.model.dateOfOnset).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
                        }
                        // gender
                    } else if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.GENDER.value) {
                        if (
                            node.type !== EntityType.EVENT &&
                            !(node.model instanceof EventModel)
                        ) {
                            nodeData.label = colorCriteria.nodeLabelValues[node.model.gender];
                        } else {
                            nodeData.label = '';
                        }
                        // occupation
                    } else if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.OCCUPATION.value) {
                        if (
                            node.type !== EntityType.EVENT &&
                            !(node.model instanceof EventModel)
                        ) {
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
                            const firstNameInitial = node.model.firstName && node.model.firstName.trim() ? node.model.firstName.trim().slice(0, 1) : '';
                            const lastNameInitial = node.model.lastName && node.model.lastName.trim() ? node.model.lastName.trim().slice(0, 1) : '';
                            nodeData.label = lastNameInitial + ' ' + firstNameInitial;
                        } else {
                            nodeData.label = '';
                        }
                        // visual id
                    } else if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.VISUAL_ID.value) {
                        if (
                            node.type !== EntityType.EVENT &&
                            !(node.model instanceof EventModel)
                        ) {
                            nodeData.label = node.model.visualId ? node.model.visualId : '';
                        } else {
                            nodeData.label = '';
                        }
                        // visual id and location
                    } else if (colorCriteria.nodeLabel === Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS.ID_AND_LOCATION.value) {
                        if (
                            node.type !== EntityType.EVENT &&
                            !(node.model instanceof EventModel)
                        ) {
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
                        if (
                            node.type !== EntityType.EVENT &&
                            !(node.model instanceof EventModel)
                        ) {
                            const lastName = node.model.lastName ? node.model.lastName : '';
                            const firstName = node.model.firstName ? node.model.firstName : '';
                            const gender = colorCriteria.genderValues[node.model.gender] ? colorCriteria.genderValues[node.model.gender] : '';
                            let outcome: string = '';
                            if (node.model instanceof CaseModel) {
                                outcome = colorCriteria.outcomeValues[node.model.outcomeId] ? colorCriteria.outcomeValues[node.model.outcomeId] : '';
                            }
                            const visualId = node.model.visualId ? '\n' + node.model.visualId : '';
                            const age = !_.isEmpty(node.model.age) ?
                                node.model.age.months > 0 ?
                                    node.model.age.months + ' ' + monthsLabel :
                                    node.model.age.years + ' ' + yearsLabel
                                : '';
                            let classification = '';
                            if (node.model instanceof CaseModel) {
                                classification = colorCriteria.classificationValues[node.model.classification] ?
                                    '\n' + colorCriteria.classificationValues[node.model.classification] :
                                    '';
                            }
                            const mainAddr = node.model.mainAddress;
                            let locationName = '';
                            if (mainAddr.locationId) {
                                const location = locationsListMap[mainAddr.locationId];
                                if (location) {
                                    locationName = '\n' + location.name;
                                }
                            }
                            let onset = '';
                            if (node.model instanceof CaseModel) {
                                onset = node.model.dateOfOnset ?
                                    '\n' + onsetLabel + ' ' + moment(node.model.dateOfOnset).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) + (node.model.isDateOfOnsetApproximate ? onsetApproximateLabel : '') :
                                    '';
                            }
                            // concatenate results
                            nodeData.label = lastName + ' ' + firstName + visualId + '\n' + age + ' - ' + gender + classification + '\n' + outcome + locationName + onset;
                        } else {
                            nodeData.label = '';
                        }
                    }

                    // check min / max dates
                    if (nodeData.dateTimeline) {
                        if (moment(nodeData.dateTimeline).isAfter(maxTimelineDate) || !maxTimelineDate) {
                            maxTimelineDate = nodeData.dateTimeline;
                        }
                        if (moment(nodeData.dateTimeline).isBefore(minTimelineDate) || !minTimelineDate) {
                            minTimelineDate = nodeData.dateTimeline;
                        }
                    }
                    graphData.nodes.push({data: nodeData});
                    selectedNodeIds[nodeData.id] = true;
                }
            });

            // generate checkpoint nodes
            const counterDate = moment(minTimelineDate);
            counterDate.subtract(1, 'days');
            const momentMaxTimelineDate = moment(maxTimelineDate);
            while (counterDate.isBefore(momentMaxTimelineDate)) {
                counterDate.add(1, 'days');
                const counterDateFormatted = counterDate.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
                // generate node
                const checkpointNode = new GraphNodeModel({
                    dateTimeline: counterDateFormatted,
                    id: counterDateFormatted,
                    name: counterDateFormatted,
                    nodeType: 'checkpoint'
                });
                graphData.nodes.push({data: checkpointNode});
            }
        }

        // generate edges based on the nodes included in the graph
        _.forEach(chainGroup.relationships, (relationship) => {
            // add relation only if the nodes are in the selectedNodes array
            if (
                !selectedNodeIds[relationship.persons[0].id] ||
                !selectedNodeIds[relationship.persons[1].id]
            ) {
                return;
            }

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
                graphEdge.label = relationship.socialRelationshipDetail ? relationship.socialRelationshipDetail : '';
            } else if (colorCriteria.edgeLabelField === Constants.TRANSMISSION_CHAIN_EDGE_LABEL_CRITERIA_OPTIONS.CLUSTER_NAME.value) {
                graphEdge.label = colorCriteria.clustersList[relationship.clusterId];
            } else if (colorCriteria.edgeLabelField === Constants.TRANSMISSION_CHAIN_EDGE_LABEL_CRITERIA_OPTIONS.DAYS_DAYE_ONSET_LAST_CONTACT.value) {
                // calculate difference in dates between the dates of onset or dates of onset and last contact.
                const sourceNode = chainGroup.nodesMap[graphEdge.source];
                const targetNode = chainGroup.nodesMap[graphEdge.target];
                let noDays = 0;
                let sourceDate = '';
                let targetDate = '';
                if (
                    sourceNode.type === EntityType.CASE &&
                    sourceNode.model instanceof CaseModel
                ) {
                    if (sourceNode.model.dateOfOnset) {
                        sourceDate = sourceNode.model.dateOfOnset;
                    }
                } else if (sourceNode.type === EntityType.CONTACT) {
                    if (relationship.contactDate) {
                        sourceDate = relationship.contactDate;
                    }
                } else if (
                    sourceNode.type === EntityType.EVENT &&
                    sourceNode.model instanceof EventModel
                ) {
                    if (sourceNode.model.date) {
                        sourceDate = sourceNode.model.date;
                    }
                }

                if (
                    targetNode.type === EntityType.CASE &&
                    targetNode.model instanceof CaseModel
                ) {
                    if (targetNode.model.dateOfOnset) {
                        targetDate = targetNode.model.dateOfOnset;
                    }
                } else if (targetNode.type === EntityType.CONTACT) {
                    if (relationship.contactDate) {
                        targetDate = relationship.contactDate;
                    }
                } else if (
                    targetNode.type === EntityType.EVENT &&
                    targetNode.model instanceof EventModel
                ) {
                    if (targetNode.model.date) {
                        targetDate = targetNode.model.date;
                    }
                }

                if (
                    sourceDate &&
                    targetDate
                ) {
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
            } else if (
                colorCriteria.edgeIconField === Constants.TRANSMISSION_CHAIN_EDGE_ICON_CRITERIA_OPTIONS.CLUSTER.value &&
                relationship.clusterId &&
                clusterIconMap &&
                clusterIconMap[relationship.clusterId]
            ) {
                graphEdge.label = clusterIconMap[relationship.clusterId];
                graphEdge.fontFamily = 'Material Icons';
            }

            // add edge
            graphData.edges.push({data: graphEdge});
        });

        // finished
        return graphData;
    }

    /**
     * Retrieve the list of COT snapshots list for an Outbreak
     */
    getSnapshotsList(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<CotSnapshotModel[]> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/transmission-chains?filter=${filter}`),
            CotSnapshotModel
        );
    }

    /**
     * Return count of COT snapshots list for an Outbreak
     */
    getSnapshotsCount(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<IBasicCount> {
        const whereFilter = queryBuilder.filter.generateCondition(true);
        return this.http.get(`outbreaks/${outbreakId}/transmission-chains/count?where=${whereFilter}`);
    }

    /**
     * Delete an existing COT snapshots list for an Outbreak
     */
    deleteSnapshot(
        outbreakId: string,
        cotSnapshotId: string
    ): Observable<any> {
        return this.http.delete(`outbreaks/${outbreakId}/transmission-chains/${cotSnapshotId}`);
    }

    /**
     * Generate cot graph snapshot
     */
    calculateIndependentTransmissionChains(
        outbreakId: string,
        snapshotName: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<any> {
        // generate filter
        const filter = queryBuilder.buildQuery();
        return this.http.post(
            `outbreaks/${outbreakId}/relationships/calculate-independent-transmission-chains?filter=${filter}`, {
                name: snapshotName
            }
        );
    }

    /**
     * Retrieve chain of transmission data
     */
    getCalculatedIndependentTransmissionChains(
        outbreakId: string,
        snapshotData: CotSnapshotModel,
        progressCallback?: (
            snapshotData: CotSnapshotModel,
            progress?: string
        ) => void
    ): Observable<TransmissionChainGroupModel> {
        return new Observable<TransmissionChainGroupModel>((observer) => {
            this.http
                .get(
                    `outbreaks/${outbreakId}/transmission-chains/${snapshotData.id}/result`, {
                        reportProgress: true,
                        observe: 'events'
                    }
                )
                .pipe(
                    catchError((err) => {
                        observer.error(err);
                        observer.complete();
                        return throwError(err);
                    })
                )
                .subscribe((response) => {
                    // handle download progress
                    switch (response.type) {
                        case HttpEventType.DownloadProgress:
                            if (progressCallback) {
                                progressCallback(
                                    snapshotData,
                                    FileSize.bytesToReadableForm(response.loaded)
                                );
                            }
                            break;

                        case HttpEventType.Response:
                            // hide progress
                            progressCallback(null);

                            // finished
                            setTimeout(() => {
                                observer.next(this.mapTransmissionChainDataToModel(response.body));
                                observer.complete();
                            });
                            break;
                    }
                });
        });
    }
}

