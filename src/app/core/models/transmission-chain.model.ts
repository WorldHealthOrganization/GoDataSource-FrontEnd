import * as _ from 'lodash';
import { EntityModel, RelationshipModel } from './entity-and-relationship.model';
import { CaseModel } from './case.model';
import { EntityType } from './entity-type';
import { Constants } from './constants';
import { EventModel } from './event.model';
import { Moment, moment } from '../helperClasses/x-moment';
import { IPermissionChainsOfTransmission } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';

export class TransmissionChainModel
    implements
        IPermissionChainsOfTransmission {
    // all Cases from Chain, mapped by Case ID
    private casesMap: {
        [id: string]: CaseModel
    } = {};
    private casesMapLength: number = 0;
    private aliveCasesCount: number = 0;
    // all events related to chain
    private eventsMap: {
        [id: string]: EventModel
    } = {};

    // all relations between Cases
    chainRelations: {
        entityIds: string[]
    }[] = [];
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

    /**
     * Static Permissions - IPermissionChainsOfTransmission
     */
    static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.COT_LIST) : false; }
    static canExportBarChart(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.COT_EXPORT_BAR_CHART) : false; }
    static canExportGraphs(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.COT_EXPORT_GRAPHS) : false; }
    static canExportCaseCountMap(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.COT_EXPORT_CASE_COUNT_MAP) : false; }
    static canViewBarChart(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.COT_VIEW_BAR_CHART) : false; }
    static canViewCaseCountMap(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.COT_VIEW_CASE_COUNT_MAP) : false; }
    static canViewGeospatialMap(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.COT_VIEW_GEOSPATIAL_MAP) : false; }
    static canViewBubbleNetwork(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.COT_VIEW_BUBBLE_NETWORK) : false; }
    static canModifyBubbleNetwork(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.COT_MODIFY_BUBBLE_NETWORK) : false; }
    static canViewHierarchicalNetwork(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.COT_VIEW_HIERARCHICAL_NETWORK) : false; }
    static canModifyHierarchicalNetwork(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.COT_MODIFY_HIERARCHICAL_NETWORK) : false; }
    static canViewTimelineNetworkDateOfOnset(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.COT_VIEW_TIMELINE_NETWORK_DATE_OF_ONSET) : false; }
    static canModifyTimelineNetworkDateOfOnset(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.COT_MODIFY_TIMELINE_NETWORK_DATE_OF_ONSET) : false; }
    static canViewTimelineNetworkDateOfLastContact(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.COT_VIEW_TIMELINE_NETWORK_DATE_OF_LAST_CONTACT) : false; }
    static canModifyTimelineNetworkDateOfLastContact(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.COT_MODIFY_TIMELINE_NETWORK_DATE_OF_LAST_CONTACT) : false; }
    static canViewTimelineNetworkDateOfReporting(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.COT_VIEW_TIMELINE_NETWORK_DATE_OF_REPORTING) : false; }
    static canModifyTimelineNetworkDateOfReporting(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.COT_MODIFY_TIMELINE_NETWORK_DATE_OF_REPORTING) : false; }
    static canViewAnyGraph(user: UserModel): boolean {
        return user ?
            TransmissionChainModel.canViewBubbleNetwork(user) ||
            TransmissionChainModel.canViewGeospatialMap(user) ||
            TransmissionChainModel.canViewHierarchicalNetwork(user) ||
            TransmissionChainModel.canViewTimelineNetworkDateOfOnset(user) ||
            TransmissionChainModel.canViewTimelineNetworkDateOfLastContact(user) ||
            TransmissionChainModel.canViewTimelineNetworkDateOfReporting(user) :
            false;
    }

    /**
     * Constructor
     */
    constructor(
        chainData,
        entityMap: {
            [id: string]: EntityModel
        } = {}
    ) {
        // data
        this.active = _.get(chainData, 'active', false);
        this.size = _.get(chainData, 'size', 0);
        this.contactsCount = _.get(chainData, 'contactsCount', 0);
        this.duration = _.get(chainData, 'period.duration', 0);

        // all relations between cases
        const chainRelationsData = _.get(chainData, 'chain', []);

        // go through all Person(case or event) IDs from relation
        this.casesMapLength = 0;
        this.aliveCasesCount = 0;
        let earliestDateOfOnset: Moment;
        const processRelationPersonId = (personId) => {
            if (
                // if we didn't already collect this Case info
                !this.casesMap[personId] &&
                !this.eventsMap[personId] &&
                // and if we have Case info
                entityMap[personId]
            ) {
                // collect Case or Event info, mapped by personID
                if (entityMap[personId].type === EntityType.EVENT) {
                    const eventModel: EventModel = entityMap[personId].model as EventModel;
                    this.eventsMap[personId] = eventModel;
                    const date = eventModel.date ?
                        moment(eventModel.date) :
                        undefined;
                    if (
                        date && (
                            !earliestDateOfOnset ||
                            date.isBefore(earliestDateOfOnset)
                        )
                    ) {
                        earliestDateOfOnset = date;
                        this.rootPerson = eventModel;
                    }
                } else {
                    const caseModel: CaseModel = entityMap[personId].model as CaseModel;
                    this.casesMap[personId] = caseModel;
                    this.casesMapLength++;
                    const date = caseModel.dateOfOnset ?
                        moment(caseModel.dateOfOnset) :
                        undefined;
                    if (
                        date && (
                            !earliestDateOfOnset ||
                            date.isBefore(earliestDateOfOnset)
                        )
                    ) {
                        earliestDateOfOnset = date;
                        this.rootPerson = caseModel;
                    }

                    if (caseModel.outcomeId !== Constants.OUTCOME_STATUS.DECEASED) {
                        this.aliveCasesCount++;
                    }
                }
            }
        };

        // go through all chain relations
        if (chainRelationsData) {
            for (let chainRelationIndex = 0; chainRelationIndex < chainRelationsData.length; chainRelationIndex++) {
                // get relation ids
                const relation: string[] = chainRelationsData[chainRelationIndex];

                // jump over if we have an invalid relation
                if (relation.length !== 2) {
                    return;
                }

                // process
                processRelationPersonId(relation[0]);
                processRelationPersonId(relation[1]);

                // keep each relation
                this.chainRelations.push({
                    entityIds: relation
                });
            }
        }

        // format
        this.earliestDateOfOnset = earliestDateOfOnset ?
            moment(earliestDateOfOnset).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
            undefined;
    }

    /**
     * Permissions - IPermissionChainsOfTransmission
     */
    canList(user: UserModel): boolean { return TransmissionChainModel.canList(user); }
    canExportBarChart(user: UserModel): boolean { return TransmissionChainModel.canExportBarChart(user); }
    canExportGraphs(user: UserModel): boolean { return TransmissionChainModel.canExportGraphs(user); }
    canExportCaseCountMap(user: UserModel): boolean { return TransmissionChainModel.canExportCaseCountMap(user); }
    canViewBarChart(user: UserModel): boolean { return TransmissionChainModel.canViewBarChart(user); }
    canViewCaseCountMap(user: UserModel): boolean { return TransmissionChainModel.canViewCaseCountMap(user); }
    canViewGeospatialMap(user: UserModel): boolean { return TransmissionChainModel.canViewGeospatialMap(user); }
    canViewBubbleNetwork(user: UserModel): boolean { return TransmissionChainModel.canViewBubbleNetwork(user); }
    canModifyBubbleNetwork(user: UserModel): boolean { return TransmissionChainModel.canModifyBubbleNetwork(user); }
    canViewHierarchicalNetwork(user: UserModel): boolean { return TransmissionChainModel.canViewHierarchicalNetwork(user); }
    canModifyHierarchicalNetwork(user: UserModel): boolean { return TransmissionChainModel.canModifyHierarchicalNetwork(user); }
    canViewTimelineNetworkDateOfOnset(user: UserModel): boolean { return TransmissionChainModel.canViewTimelineNetworkDateOfOnset(user); }
    canModifyTimelineNetworkDateOfOnset(user: UserModel): boolean { return TransmissionChainModel.canModifyTimelineNetworkDateOfOnset(user); }
    canViewTimelineNetworkDateOfLastContact(user: UserModel): boolean { return TransmissionChainModel.canViewTimelineNetworkDateOfLastContact(user); }
    canModifyTimelineNetworkDateOfLastContact(user: UserModel): boolean { return TransmissionChainModel.canModifyTimelineNetworkDateOfLastContact(user); }
    canViewTimelineNetworkDateOfReporting(user: UserModel): boolean { return TransmissionChainModel.canViewTimelineNetworkDateOfReporting(user); }
    canModifyTimelineNetworkDateOfReporting(user: UserModel): boolean { return TransmissionChainModel.canModifyTimelineNetworkDateOfReporting(user); }
    canViewAnyGraph(user: UserModel): boolean { return TransmissionChainModel.canViewAnyGraph(user); }

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
        return this.casesMapLength;
    }

    /**
     * Number of Alive Cases in Chain
     * @returns {any}
     */
    get noAliveCases() {
        return this.aliveCasesCount;
    }
}

export class TransmissionChainGroupModel {
    // all entities related to Chain (Cases, Contacts, Contact of Contacts and Events)
    nodesMap: {
        [id: string]: EntityModel
    } = {};

    // all relationships between Chain entities
    relationships: RelationshipModel[] = [];

    // chains
    private originalChains = [];
    chains: TransmissionChainModel[] = [];

    /**
     * Constructor
     */
    constructor(
        nodes,
        relationships,
        chains
    ) {
        // map nodes
        this.nodesMap = {};
        _.each(nodes, (node) => {
            const entity = new EntityModel(node);
            this.nodesMap[entity.model.id] = entity;
        });

        // map relationships
        this.relationships = [];
        _.each(relationships, (relationship) => {
            // invalid relationship ?
            if (
                !relationship.persons ||
                relationship.persons.length < 2
            ) {
                return;
            }

            // init relationship
            const relModel = new RelationshipModel(relationship);
            this.relationships.push(relModel);
        });

        // map chains
        this.originalChains = chains;
        this.chains = (chains || []).map((chainData) => {
            return new TransmissionChainModel(
                chainData,
                this.nodesMap
            );
        });
    }
}

export interface ITransmissionChainGroupPageModel {
    chains: number[];
    isolatedNodes: string[];
    totalSize: number;
    pageIndex: number;
    pageLabel: string;
}
