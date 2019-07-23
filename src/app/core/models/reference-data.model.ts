import * as _ from 'lodash';
import { environment } from '../../../environments/environment';
import { Constants } from './constants';
import { BaseModel } from './base.model';

export class ReferenceDataCategoryModel {
    id: string;
    name: string;
    description: string;
    entries: ReferenceDataEntryModel[];

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.description = _.get(data, 'description');
        this.entries = _.get(data, 'entries', []);
    }
}

export class ReferenceDataEntryModel extends BaseModel {
    id: string;
    categoryId: string;
    value: string;
    description: string;
    readonly: boolean;
    active: boolean;
    category: ReferenceDataCategoryModel;
    colorCode: string;
    order: number;

    private _iconId: string;
    iconUrl: string;
    set iconId(iconId: string) {
        this._iconId = iconId;
        this.iconUrl = _.isEmpty(this.iconId) ?
            undefined :
            `${environment.apiUrl}/icons/${this.iconId}/download`;
    }
    get iconId(): string {
        return this._iconId;
    }

    constructor(data = null) {
        super(data);

        this.id = _.get(data, 'id');
        this.categoryId = _.get(data, 'categoryId');
        this.value = _.get(data, 'value');
        this.description = _.get(data, 'description');
        this.readonly = _.get(data, 'readOnly', false);
        this.active = _.get(data, 'active', true);
        this.colorCode = _.get(data, 'colorCode');
        this.iconId = _.get(data, 'iconId');
        this.order = _.get(data, 'order');

        // add category
        const categoryData = _.get(data, 'category');
        if (categoryData) {
            this.category = new ReferenceDataCategoryModel(categoryData);
        }
    }

    /**
     * Return color code / default color
     */
    getColorCode(): string {
        return this.colorCode ?
            this.colorCode :
            Constants.DEFAULT_COLOR_REF_DATA;
    }
}

export enum ReferenceDataCategory {
    GLOSSARY = 'LNG_REFERENCE_DATA_CATEGORY_GLOSSARY_TERM',
    CASE_CLASSIFICATION = 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION',
    CASE_CLASSIFICATION_CONFIRMED_BY_LAB_RESULT = 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_CONFIRMED_BY_LAB_RESULT',
    GENDER = 'LNG_REFERENCE_DATA_CATEGORY_GENDER',
    OCCUPATION = 'LNG_REFERENCE_DATA_CATEGORY_OCCUPATION',
    LAB_NAME = 'LNG_REFERENCE_DATA_CATEGORY_LAB_NAME',
    TYPE_OF_SAMPLE = 'LNG_REFERENCE_DATA_CATEGORY_TYPE_OF_SAMPLE',
    TYPE_OF_LAB_TEST = 'LNG_REFERENCE_DATA_CATEGORY_TYPE_OF_LAB_TEST',
    LAB_TEST_RESULT = 'LNG_REFERENCE_DATA_CATEGORY_LAB_TEST_RESULT',
    DOCUMENT_TYPE = 'LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE',
    DISEASE = 'LNG_REFERENCE_DATA_CATEGORY_DISEASE',
    EXPOSURE_TYPE = 'LNG_REFERENCE_DATA_CATEGORY_EXPOSURE_TYPE',
    EXPOSURE_INTENSITY = 'LNG_REFERENCE_DATA_CATEGORY_EXPOSURE_INTENSITY',
    EXPOSURE_FREQUENCY = 'LNG_REFERENCE_DATA_CATEGORY_EXPOSURE_FREQUENCY',
    EXPOSURE_DURATION = 'LNG_REFERENCE_DATA_CATEGORY_EXPOSURE_DURATION',
    CERTAINTY_LEVEL = 'LNG_REFERENCE_DATA_CATEGORY_CERTAINTY_LEVEL',
    RISK_LEVEL = 'LNG_REFERENCE_DATA_CATEGORY_RISK_LEVEL',
    CONTEXT_OF_TRANSMISSION = 'LNG_REFERENCE_DATA_CATEGORY_CONTEXT_OF_TRANSMISSION',
    OUTCOME = 'LNG_REFERENCE_DATA_CATEGORY_OUTCOME',
    QUESTION_ANSWER_TYPE = 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_ANSWER_TYPE',
    QUESTION_CATEGORY = 'LNG_REFERENCE_DATA_CATEGORY_QUESTION_CATEGORY',
    CUSTOMIZABLE_UI_ELEMENT = 'LNG_REFERENCE_DATA_CATEGORY_MISCELLANEOUS_CUSTOMIZABLE_UI_ELEMENT',
    PERSON_TYPE = 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE',
    COUNTRY = 'LNG_REFERENCE_DATA_CATEGORY_COUNTRY',
    ADDRESS_TYPE = 'LNG_REFERENCE_DATA_CATEGORY_ADDRESS_TYPE',
    CONTACT_DAILY_FOLLOW_UP_STATUS = 'LNG_REFERENCE_DATA_CONTACT_DAILY_FOLLOW_UP_STATUS_TYPE',
    CONTACT_FINAL_FOLLOW_UP_STATUS = 'LNG_REFERENCE_DATA_CONTACT_FINAL_FOLLOW_UP_STATUS_TYPE',
    LOCATION_GEOGRAPHICAL_LEVEL = 'LNG_REFERENCE_DATA_CATEGORY_LOCATION_GEOGRAPHICAL_LEVEL',
    PERSON_DATE_TYPE = 'LNG_REFERENCE_DATA_CATEGORY_PERSON_DATE_TYPE'
}
