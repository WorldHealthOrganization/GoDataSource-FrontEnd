import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Constants } from '../../models/constants';
import { EntityType } from '../../models/entity-type';
import * as _ from 'lodash';
import { HttpClient } from '@angular/common/http';
import { Moment } from 'moment';
import * as moment from 'moment';

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
    getFilterYesNoOptions(): Observable<any[]> {
        return Observable.of(Object.values(Constants.FILTER_YES_NO_OPTIONS));
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
     * @returns {EntityType[]}
     */
    getAvailableRelatedEntityTypes(forType: EntityType = null): EntityType[] {
        let availableTypes = [];

        switch (forType) {
            case EntityType.CASE:
                // all types can be related with a Case
                availableTypes = [EntityType.CASE, EntityType.CONTACT, EntityType.EVENT];
                break;

            case EntityType.EVENT:
                // all types, except Event, can be related with an Event
                availableTypes = [EntityType.CASE, EntityType.CONTACT];
                break;

            case EntityType.CONTACT:
                // all types, except Contact, can be related with a Contact
                availableTypes = [EntityType.CASE, EntityType.EVENT];
                break;
        }

        return availableTypes;
    }

    /**
     * Retrieve the list of transmission chain view types
     * @returns {Observable<any[]>}
     */
    getTransmissionChainViewTypes(): Observable<any[]> {
        return Observable.of(Object.values(Constants.TRANSMISSION_CHAIN_VIEW_TYPES));
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
     * Retrieve the list of criteria used for node icon - radio button
     * @returns {Observable<any[]>}
     */
    getTransmissionChainNodeIconCriteriaOptions(): Observable<any[]> {
        return Observable.of(Object.values(Constants.TRANSMISSION_CHAIN_NODE_ICON_CRITERIA_OPTIONS));
    }

    /**
     * Retrieve the list of criteria used for node label - radio button
     * @returns {Observable<any[]>}
     */
    getTransmissionChainNodeLabelCriteriaOptions(): Observable<any[]> {
        return Observable.of(Object.values(Constants.TRANSMISSION_CHAIN_NODE_LABEL_CRITERIA_OPTIONS));
    }
}

