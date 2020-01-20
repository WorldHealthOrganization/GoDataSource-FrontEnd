import * as _ from 'lodash';
import { EntityModel, RelationshipModel } from './entity-and-relationship.model';
import { CaseModel } from './case.model';
import { EntityType } from './entity-type';
import { Constants } from './constants';
import { EventModel } from './event.model';
import { moment } from '../helperClasses/x-moment';
import { IPermissionChainsOfTransmission } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';

export class TransmissionChainRelation {
    constructor(
        public entityIds: string[]
    ) {}
}

export class TransmissionChainModel
    implements
        IPermissionChainsOfTransmission {
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
