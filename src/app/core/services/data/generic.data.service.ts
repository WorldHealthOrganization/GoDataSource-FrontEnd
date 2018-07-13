import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Constants } from '../../models/constants';

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
     * Retrieve the list of Active options
     * @returns {Observable<any[]>}
     */
    getActiveOptions(): Observable<any[]> {
        return Observable.of(Object.values(Constants.ACTIVE_OPTIONS));
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
}

