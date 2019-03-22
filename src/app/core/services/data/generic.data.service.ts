import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Constants } from '../../models/constants';
import { EntityType } from '../../models/entity-type';
import * as _ from 'lodash';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';
import { Moment } from 'moment';
import { LabelValuePair } from '../../models/label-value-pair';
import { RelationshipType } from '../../enums/relationship-type.enum';

@Injectable()
export class GenericDataService {
    constructor(
        private http: HttpClient
    ) {}

    /**
     * Retrieve server date & time
     * @returns {Observable<string>}
     */
    getServerUTCCurrentDateTime(): Observable<string> {
        return this.http.get('system-settings/utc-date')
            .map((dateObject: { date }) => {
                return _.get(dateObject, 'date');
            });
    }

    /**
     * Retrieve server current date
     * @returns {Observable<Moment>}
     */
    getServerUTCToday(): Observable<Moment> {
        return this.getServerUTCCurrentDateTime()
            .map((serverDateTime: string) => {
                return moment(serverDateTime).startOf('day');
            });
    }

    /**
     * Retrieve the list of Filter Yes / No options
     * @returns {Observable<any[]>}
     */
    getFilterYesNoOptions(withoutAll: boolean = false): Observable<any[]> {
        return Observable.of(Object.values(withoutAll ? _.filter(Constants.FILTER_YES_NO_OPTIONS, (o) => o.value !== '' ) : Constants.FILTER_YES_NO_OPTIONS));
    }

    /**
     * Retrieve the list of Answer Types
     * @returns {Observable<any[]>}
     */
    getAnswerTypesList(): Observable<any[]> {
        return Observable.of(Object.values(Constants.ANSWER_TYPES));
    }

    /**
     * Retrieve the list of Progress Options
     * @returns {Observable<any[]>}
     */
    getProgressOptionsList(): Observable<any[]> {
        return Observable.of(Object.values(Constants.PROGRESS_OPTIONS));
    }

    /**
     * Retrieve the list of available Entity Types that, optionally, can be related to a given type (Case, Contact or Event)
     * @param {EntityType} forType
     * @param {RelationshipType} relationshipType
     * @returns {EntityType[]}
     */
    getAvailableRelatedEntityTypes(
        forType: EntityType = null,
        relationshipType: RelationshipType
    ): EntityType[] {
        let availableTypes = [];

        switch (forType) {
            case EntityType.CASE:
            case EntityType.EVENT:
                // all types can be related with a Case or an Event
                availableTypes = [EntityType.CASE, EntityType.EVENT];
                // a contact cannot be an exposure
                if (relationshipType === RelationshipType.CONTACT) {
                    availableTypes.push(EntityType.CONTACT);
                }
                break;

            case EntityType.CONTACT:
                // all types, except Contact, can be related with a Contact
                availableTypes = [EntityType.CASE, EntityType.EVENT];
                break;
        }

        return availableTypes;
    }

    /**
     * Get entity type options
     */
    getEntityTypeOptions(): Observable<any[]> {
        return Observable.of([
            new LabelValuePair(
                EntityType.CASE,
                EntityType.CASE
            ),
            new LabelValuePair(
                EntityType.CONTACT,
                EntityType.CONTACT
            ),
            new LabelValuePair(
                EntityType.EVENT,
                EntityType.EVENT
            )
        ]);
    }

    /**
     * Retrieve the list of transmission chain view types
     * @returns {Observable<any[]>}
     */
    getTransmissionChainViewTypes(): Observable<any[]> {
        return Observable.of(Object.values(Constants.TRANSMISSION_CHAIN_VIEW_TYPES));
    }

    /**
     * Retrieve the list of transmission chain view types
     * @returns {Observable<any[]>}
     */
    getEpiCurvesTypes(): Observable<any[]> {
        return Observable.of(Object.values(Constants.EPI_CURVE_TYPES));
    }

    /**
     * Retrieve backup module list
     */
    getBackupModuleList(): Observable<any[]> {
        return Observable.of(Object.values(Constants.SYSTEM_BACKUP_MODULES));
    }

    /**
     * Retrieve backup status list
     */
    getBackupStatusList(): Observable<any[]> {
        return Observable.of(Object.values(Constants.SYSTEM_BACKUP_STATUS));
    }

    /**
     * Retrieve backup status list
     */
    getSyncLogStatusList(): Observable<any[]> {
        return Observable.of(Object.values(Constants.SYSTEM_SYNC_LOG_STATUS));
    }

    /**
     * Retrieve the list of criteria used for node color - radio button
     * @returns {Observable<any[]>}
     */
    getTransmissionChainNodeColorCriteriaOptions(): Observable<any[]> {
        return Observable.of(Object.values(Constants.TRANSMISSION_CHAIN_NODE_COLOR_CRITERIA_OPTIONS));
    }

    /**
     * Retrieve the list of criteria used for edge color - radio button
     * @returns {Observable<any[]>}
     */
    getTransmissionChainEdgeColorCriteriaOptions(): Observable<any[]> {
        return Observable.of(Object.values(Constants.TRANSMISSION_CHAIN_EDGE_COLOR_CRITERIA_OPTIONS));
    }

    /**
     * Retrieve the list of criteria used for edge label - radio button
     * @returns {Observable<any[]>}
     */
    getTransmissionChainEdgeLabelCriteriaOptions(): Observable<any[]> {
        return Observable.of(Object.values(Constants.TRANSMISSION_CHAIN_EDGE_LABEL_CRITERIA_OPTIONS));
    }

    /**
     * Retrieve the list of criteria used for edge icon - radio button
     * @returns {Observable<any[]>}
     */
    getTransmissionChainEdgeIconCriteriaOptions(): Observable<any[]> {
        return Observable.of(Object.values(Constants.TRANSMISSION_CHAIN_EDGE_ICON_CRITERIA_OPTIONS));
    }

    /**
     * Retrieve the list of criteria used for node icon - radio button
     * @returns {Observable<any[]>}
     */
    getTransmissionChainNodeIconCriteriaOptions(): Observable<any[]> {
        return Observable.of(Object.values(Constants.TRANSMISSION_CHAIN_NODE_ICON_CRITERIA_OPTIONS));
    }

    /**
     * Retrieve the list of criteria used for node shape - radio button
     * @returns {Observable<any[]>}
     */
    getTransmissionChainNodeShapeCriteriaOptions(): Observable<any[]> {
        return Observable.of(Object.values(Constants.TRANSMISSION_CHAIN_NODE_SHAPE_CRITERIA_OPTIONS));
    }

    /**
     * Retrieve the list of criteria used for node label - radio button
     * @returns {Observable<any[]>}
     */
    getTransmissionChainNodeLabelCriteriaOptions(): Observable<any[]> {
        return Observable.of(Object.values(Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS));
    }

    /**
     * Retrieve the list of audit log actions
     * @returns {Observable<any[]>}
     */
    getAuditLogActionOptions(): Observable<any[]> {
        return Observable.of(Object.values(Constants.AUDIT_LOG_ACTION_OPTIONS));
    }

    /**
     * Retrieve the list of modules
     * @returns {Observable<any[]>}
     */
    getDataModuleOptions(): Observable<any[]> {
        return Observable.of(Object.values(Constants.DATA_MODULES));
    }

    /**
     * Retrieve the list of sync package modules
     * @returns {Observable<any[]>}
     */
    getSyncPackageModuleOptions(): Observable<any[]> {
        return Observable.of(Object.values(Constants.SYNC_PACKAGE_EXPORT_MODULES));
    }

    /**
     * Retrieve the list of sync package export types
     * @returns {Observable<any[]>}
     */
    getSyncPackageExportTypeOptions(): Observable<any[]> {
        return Observable.of(Object.values(Constants.SYNC_PACKAGE_EXPORT_TYPES));
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
        return Observable.of(Object.values(options));
    }

    /**
     * Retrieve the list of gantt chart types
     * @returns {Observable<any[]>}
     */
    getGanttChartTypes(): Observable<any[]> {
        return Observable.of(Object.values(Constants.GANTT_CHART_TYPES));
    }
}

