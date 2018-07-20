import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Constants } from '../../models/constants';
import { EntityType } from '../../models/entity.model';
import * as _ from 'lodash';

@Injectable()
export class GenericDataService {
    /**
     * Retrieve the list of Gender options
     * @returns {Observable<any[]>}
     */
    getGenderList(): Observable<any[]> {
        return Observable.of(Object.values(Constants.GENDER));
    }

    /**
     * Retrieve the list of Countries
     * @returns {Observable<any[]>}
     */
    getCountriesList(): Observable<any[]> {
        return Observable.of(Object.values(Constants.COUNTRY));
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
     * Retrieve the list of available Entity Types that, optionally, can be related to a given type (Case, Contact or Event)
     * @param {EntityType} forType
     * @returns {Observable<any[]>}
     */
    getAvailableRelatedEntityTypes(forType: EntityType = null): Observable<any[]> {
        const availableTypes = _.cloneDeep(Constants.ENTITY_TYPE);

        switch (forType) {
            case EntityType.CASE:
            case EntityType.EVENT:
                // all types can be related with a Case or an Event
                break;

            case EntityType.CONTACT:
                // all types, except Contact, can be related with a Contact
                delete availableTypes.CONTACT;
                break;
        }

        return Observable.of(Object.values(availableTypes));
    }
}

