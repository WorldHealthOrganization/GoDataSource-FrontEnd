import * as _ from 'lodash';
import { environment } from '../../../environments/environment';
import { Constants } from './constants';
import { BaseModel } from './base.model';
import { IPermissionBasic, IPermissionExportable, IPermissionImportable } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';

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
    PERSON_DATE_TYPE = 'LNG_REFERENCE_DATA_CATEGORY_PERSON_DATE_TYPE',
    VACCINES = 'LNG_REFERENCE_DATA_CATEGORY_VACCINE',
    VACCINES_STATUS = 'LNG_REFERENCE_DATA_CATEGORY_VACCINE_STATUS',
    PREGNANCY_STATUS = 'LNG_REFERENCE_DATA_CATEGORY_PREGNANCY_STATUS',
    INSTITUTION_NAME = 'LNG_REFERENCE_DATA_CATEGORY_INSTITUTION_NAME'
}

export class ReferenceDataCategoryModel
    implements
        IPermissionBasic,
        IPermissionExportable,
        IPermissionImportable {
    id: string;
    name: string;
    description: string;
    entries: ReferenceDataEntryModel[];

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return false; }
    static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.REFERENCE_DATA_LIST) : false; }
    static canCreate(user: UserModel): boolean { return false; }
    static canModify(user: UserModel): boolean { return false; }
    static canDelete(user: UserModel): boolean { return false; }

    /**
     * Static Permissions - IPermissionExportable
     */
    static canExport(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.REFERENCE_DATA_EXPORT) : false; }

    /**
     * Static Permissions - IPermissionImportable
     */
    static canImport(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.REFERENCE_DATA_IMPORT) : false; }

    /**
     * Constructor
     */
    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.description = _.get(data, 'description');
        this.entries = _.get(data, 'entries', []);
    }

    /**
     * Permissions - IPermissionBasic
     */
    canView(user: UserModel): boolean { return ReferenceDataCategoryModel.canView(user); }
    canList(user: UserModel): boolean { return ReferenceDataCategoryModel.canList(user); }
    canCreate(user: UserModel): boolean { return ReferenceDataCategoryModel.canCreate(user); }
    canModify(user: UserModel): boolean { return ReferenceDataCategoryModel.canModify(user); }
    canDelete(user: UserModel): boolean { return ReferenceDataCategoryModel.canDelete(user); }

    /**
     * Permissions - IPermissionExportable
     */
    canExport(user: UserModel): boolean { return ReferenceDataCategoryModel.canExport(user); }

    /**
     * Permissions - IPermissionImportable
     */
    canImport(user: UserModel): boolean { return ReferenceDataCategoryModel.canImport(user); }
}

export class ReferenceDataEntryModel
    extends BaseModel
    implements
        IPermissionBasic {
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

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.REFERENCE_DATA_CATEGORY_ITEM_VIEW) : false; }
    static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.REFERENCE_DATA_CATEGORY_ITEM_LIST) : false; }
    static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.REFERENCE_DATA_CATEGORY_ITEM_CREATE) : false; }
    static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.REFERENCE_DATA_CATEGORY_ITEM_VIEW, PERMISSION.REFERENCE_DATA_CATEGORY_ITEM_MODIFY) : false; }
    static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.REFERENCE_DATA_CATEGORY_ITEM_DELETE) : false; }

    /**
     * Constructor
     */
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
     * Permissions - IPermissionBasic
     */
    canView(user: UserModel): boolean { return ReferenceDataEntryModel.canView(user); }
    canList(user: UserModel): boolean { return ReferenceDataEntryModel.canList(user); }
    canCreate(user: UserModel): boolean { return ReferenceDataEntryModel.canCreate(user); }
    canModify(user: UserModel): boolean { return ReferenceDataEntryModel.canModify(user); }
    canDelete(user: UserModel): boolean { return ReferenceDataEntryModel.canDelete(user); }

    /**
     * Return color code / default color
     */
    getColorCode(): string {
        return this.colorCode ?
            this.colorCode :
            Constants.DEFAULT_COLOR_REF_DATA;
    }
}
