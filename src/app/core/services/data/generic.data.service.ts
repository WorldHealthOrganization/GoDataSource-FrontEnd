import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Constants } from '../../models/constants';
import { EntityType } from '../../models/entity-type';
import * as _ from 'lodash';
import { HttpClient } from '@angular/common/http';

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
     * Retrieve the list of Gender options
     * @returns {Observable<any[]>}
     */
    getGenderList(): Observable<any[]> {
        return Observable.of(Object.values(Constants.GENDER));
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
     * Retrieve the list of Question Categories
     * @returns {Observable<any[]>}
     */
    getQuestionCategoriesList(): Observable<any[]> {
        return Observable.of(Object.values(Constants.QUESTION_CATEGORIES));
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
}

