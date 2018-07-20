import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Constants } from '../../models/constants';
import { EntityType } from '../../models/entity.model';
import * as _ from 'lodash';

@Injectable()
export class GenericDataService {
    /**
     * Retrieve the list of Genders
     * @returns {Observable<any[]>}
     */
    getGendersList(): Observable<any[]> {
        return Observable.of(Object.values(Constants.GENDER));
    }

    /**
     * Retrieve the list of Case Classifications
     * @returns {Observable<any[]>}
     */
    getCaseClassificationsList(): Observable<any[]> {
        return Observable.of(Object.values(Constants.CASE_CLASSIFICATION));
    }

    /**
     * Retrieve the list of Risk Levels for a Case
     * @returns {Observable<any[]>}
     */
    getCaseRiskLevelsList(): Observable<any[]> {
        return Observable.of(Object.values(Constants.CASE_RISK_LEVEL));
    }

    /**
     * Retrieve the list of Diseases
     * @returns {Observable<any[]>}
     */
    getDiseasesList(): Observable<any[]> {
        return Observable.of(Object.values(Constants.DISEASE));
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
     * Retrieve the list of Certainty Level options
     * @returns {Observable<any[]>}
     */
    getCertaintyLevelOptions(): Observable<any[]> {
        return Observable.of(Object.values(Constants.CERTAINTY_LEVEL_OPTIONS));
    }

    /**
     * Retrieve the list of Exposure Type options
     * @returns {Observable<any[]>}
     */
    getExposureTypeOptions(): Observable<any[]> {
        return Observable.of(Object.values(Constants.EXPOSURE_TYPE_OPTIONS));
    }

    /**
     * Retrieve the list of Exposure Frequency options
     * @returns {Observable<any[]>}
     */
    getExposureFrequencyOptions(): Observable<any[]> {
        return Observable.of(Object.values(Constants.EXPOSURE_FREQUENCY_OPTIONS));
    }

    /**
     * Retrieve the list of Exposure Duration options
     * @returns {Observable<any[]>}
     */
    getExposureDurationOptions(): Observable<any[]> {
        return Observable.of(Object.values(Constants.EXPOSURE_DURATION_OPTIONS));
    }

    /**
     * Retrieve the list of Social Relationship options
     * @returns {Observable<any[]>}
     */
    getSocialRelationshipOptions(): Observable<any[]> {
        return Observable.of(Object.values(Constants.SOCIAL_RELATIONSHIP_OPTIONS));
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

