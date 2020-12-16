import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Constants } from '../../models/constants';
import { EntityType } from '../../models/entity-type';
import * as _ from 'lodash';
import { RelationshipType } from '../../enums/relationship-type.enum';

@Injectable()
export class GenericDataService {
    /**
     * Retrieve the list of Filter Yes / No options
     * @returns {Observable<any[]>}
     */
    getFilterYesNoOptions(withoutAll: boolean = false): Observable<any[]> {
        return of(Object.values(withoutAll ? _.filter(Constants.FILTER_YES_NO_OPTIONS, (o) => o.value !== '' ) : Constants.FILTER_YES_NO_OPTIONS));
    }

    /**
     * Retrieve the list of Answer Types
     * @returns {Observable<any[]>}
     */
    getAnswerTypesList(): Observable<any[]> {
        return of(Object.values(Constants.ANSWER_TYPES));
    }

    /**
     * Retrieve the list of Answer Display Orientations
     * @returns {Observable<any[]>}
     */
    getAnswersDisplayOrientationsList(): Observable<any[]> {
        return of(Object.values(Constants.ANSWERS_DISPLAY));
    }

    /**
     * Retrieve the list of Progress Options
     * @returns {Observable<any[]>}
     */
    getProgressOptionsList(): Observable<any[]> {
        return of(Object.values(Constants.PROGRESS_OPTIONS));
    }

    /**
     * Retrieve the list of available Entity Types that, optionally, can be related to a given type (Case, Contact or Event)
     * @param {EntityType} forType
     * @param {RelationshipType} relationshipType
     * @param {string} fromPage
     * @returns {EntityType[]}
     */
    getAvailableRelatedEntityTypes(
        forType: EntityType = null,
        relationshipType: RelationshipType,
        fromPage: string
    ): EntityType[] {
        switch (fromPage) {
            case Constants.APP_PAGE.PEOPLE_TO_SHARE_RELATIONSHIPS_WITH.value:
                return this.getAvailableTypesForShare(forType, relationshipType);
            case Constants.APP_PAGE.AVAILABLE_ENTITIES_FOR_SWITCH.value:
                return this.getAvailableTypesForSwitch(forType, relationshipType);
            case Constants.APP_PAGE.AVAILABLE_ENTITIES_FOR_RELATIONSHIPS.value:
                return this.getAvailableTypesForAssign(forType, relationshipType);
        }
    }

    /**
     * Get available entity types for share
     * @param forType
     * @param relationshipType
     */
    private getAvailableTypesForShare(
        forType: EntityType = null,
        relationshipType: RelationshipType
    ): EntityType[] {
        let availableTypes = [];
        // share for Event/Case
        if (forType === EntityType.EVENT || forType === EntityType.CASE ) {
            availableTypes = [EntityType.EVENT, EntityType.CASE, EntityType.CONTACT];
            if (relationshipType === RelationshipType.CONTACT) {
                availableTypes = [EntityType.EVENT, EntityType.CASE ];
            }
        }
        // share for Contact
        if (forType === EntityType.CONTACT) {
            availableTypes = [EntityType.CONTACT];
        }
        // share for Contact of Contact
        if (forType === EntityType.CONTACT_OF_CONTACT) {
            availableTypes = [EntityType.CONTACT_OF_CONTACT];
        }

        return availableTypes;
    }

    /**
     * Get available entity type for switch
     * @param forType
     * @param relationshipType
     */
    private getAvailableTypesForSwitch(
        forType: EntityType = null,
        relationshipType: RelationshipType
    ): EntityType[] {
        let availableTypes = [];
        // switch for Event/Case
        if (forType === EntityType.EVENT || forType === EntityType.CASE ) {
            availableTypes = [EntityType.EVENT, EntityType.CASE];
            if (relationshipType === RelationshipType.CONTACT) {
                availableTypes = [EntityType.EVENT, EntityType.CASE];
            }
        }
        // switch for Contact
        if (forType === EntityType.CONTACT) {
            availableTypes = [EntityType.CONTACT];
        }

        return availableTypes;
    }

    /**
     * Get available entity types for assign
     * @param forType
     * @param relationshipType
     */
    private getAvailableTypesForAssign(
        forType: EntityType = null,
        relationshipType: RelationshipType
    ): EntityType[] {
        let availableTypes = [];
        // add relationship for Event/Case
        if (forType === EntityType.EVENT || forType === EntityType.CASE ) {
            availableTypes = [EntityType.EVENT, EntityType.CASE];
            if (relationshipType ===  RelationshipType.CONTACT) {
                availableTypes = [EntityType.EVENT, EntityType.CASE, EntityType.CONTACT];

            }
        }
        // add relationship for Contact
        if (forType === EntityType.CONTACT) {
            availableTypes = [EntityType.EVENT, EntityType.CASE];
            if (relationshipType === RelationshipType.CONTACT) {
                availableTypes = [EntityType.CONTACT_OF_CONTACT];
            }
        }
        // add relationship for Contact of Contact
        if (forType === EntityType.CONTACT_OF_CONTACT) {
            availableTypes = [EntityType.CONTACT];
        }

        return availableTypes;
    }

    /**
     * Retrieve the list of transmission chain view types
     * @returns {Observable<any[]>}
     */
    getTransmissionChainViewTypes(): Observable<any[]> {
        return of(Object.values(Constants.TRANSMISSION_CHAIN_VIEW_TYPES));
    }

    /**
     * Retrieve the list of transmission chain view types
     * @returns {Observable<any[]>}
     */
    getEpiCurvesTypes(): Observable<any[]> {
        return of(Object.values(Constants.EPI_CURVE_TYPES));
    }

    /**
     * Retrieve the list of transmission chain week view type
     * @returns {Observable<any[]>}
     */
    getEpiCurvesWeekTypes(): Observable<any[]> {
        return of(Object.values(Constants.EPI_CURVE_WEEK_TYPES));
    }

    /**
     * Retrieve backup module list
     */
    getBackupModuleList(): Observable<any[]> {
        return of(Object.values(Constants.SYSTEM_BACKUP_MODULES));
    }

    /**
     * Retrieve backup status list
     */
    getBackupStatusList(): Observable<any[]> {
        return of(Object.values(Constants.SYSTEM_BACKUP_STATUS));
    }

    /**
     * Retrieve backup status list
     */
    getSyncLogStatusList(): Observable<any[]> {
        return of(Object.values(Constants.SYSTEM_SYNC_LOG_STATUS));
    }

    /**
     * Retrieve the list of criteria used for node color - radio button
     * @returns {Observable<any[]>}
     */
    getTransmissionChainNodeColorCriteriaOptions(): Observable<any[]> {
        return of(Object.values(Constants.TRANSMISSION_CHAIN_NODE_COLOR_CRITERIA_OPTIONS));
    }

    /**
     * Retrieve the list of criteria used for edge color - radio button
     * @returns {Observable<any[]>}
     */
    getTransmissionChainEdgeColorCriteriaOptions(): Observable<any[]> {
        return of(Object.values(Constants.TRANSMISSION_CHAIN_EDGE_COLOR_CRITERIA_OPTIONS));
    }

    /**
     * Retrieve the list of criteria used for edge label - radio button
     * @returns {Observable<any[]>}
     */
    getTransmissionChainEdgeLabelCriteriaOptions(): Observable<any[]> {
        return of(Object.values(Constants.TRANSMISSION_CHAIN_EDGE_LABEL_CRITERIA_OPTIONS));
    }

    /**
     * Retrieve the list of criteria used for edge icon - radio button
     * @returns {Observable<any[]>}
     */
    getTransmissionChainEdgeIconCriteriaOptions(): Observable<any[]> {
        return of(Object.values(Constants.TRANSMISSION_CHAIN_EDGE_ICON_CRITERIA_OPTIONS));
    }

    /**
     * Retrieve the list of criteria used for node icon - radio button
     * @returns {Observable<any[]>}
     */
    getTransmissionChainNodeIconCriteriaOptions(): Observable<any[]> {
        return of(Object.values(Constants.TRANSMISSION_CHAIN_NODE_ICON_CRITERIA_OPTIONS));
    }

    /**
     * Retrieve the list of criteria used for node shape - radio button
     * @returns {Observable<any[]>}
     */
    getTransmissionChainNodeShapeCriteriaOptions(): Observable<any[]> {
        return of(Object.values(Constants.TRANSMISSION_CHAIN_NODE_SHAPE_CRITERIA_OPTIONS));
    }

    /**
     * Retrieve the list of criteria used for node label - radio button
     * @returns {Observable<any[]>}
     */
    getTransmissionChainNodeLabelCriteriaOptions(): Observable<any[]> {
        return of(Object.values(Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS));
    }

    /**
     * Retrieve the list of audit log actions
     * @returns {Observable<any[]>}
     */
    getAuditLogActionOptions(): Observable<any[]> {
        return of(Object.values(Constants.AUDIT_LOG_ACTION_OPTIONS));
    }

    /**
     * Retrieve the list of modules
     * @returns {Observable<any[]>}
     */
    getDataModuleOptions(): Observable<any[]> {
        return of(Object.values(Constants.DATA_MODULES));
    }

    /**
     * Retrieve the list of sync package modules
     * @returns {Observable<any[]>}
     */
    getSyncPackageModuleOptions(): Observable<any[]> {
        return of(Object.values(Constants.SYNC_PACKAGE_EXPORT_MODULES));
    }

    /**
     * Retrieve the list of sync package export types
     * @returns {Observable<any[]>}
     */
    getSyncPackageExportTypeOptions(): Observable<any[]> {
        return of(Object.values(Constants.SYNC_PACKAGE_EXPORT_TYPES));
    }

    /**
     * Retrieve the list of range follow-up export group by values
     * @returns {Observable<any[]>}
     */
    getRangeFollowUpGroupByOptions(removeRisk: boolean = false): Observable<any[]> {
        const options = _.cloneDeep(Constants.RANGE_FOLLOW_UP_EXPORT_GROUP_BY);
        if (removeRisk) {
            delete options.RISK;
        }
        return of(Object.values(options));
    }

    /**
     * Retrieve the list of gantt chart types
     * @returns {Observable<any[]>}
     */
    getGanttChartTypes(): Observable<any[]> {
        return of(Object.values(Constants.GANTT_CHART_TYPES));
    }

    /**
     * Retrieve the list of cot snapshot possible statuses
     */
    getCotSnapshotStatusList(): Observable<any[]> {
        return of(Object.values(Constants.COT_SNAPSHOT_STATUSES));
    }
}

