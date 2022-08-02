import { ILabelValuePairModel } from '../../../forms-v2/core/label-value-pair.model';
import { NgForm } from '@angular/forms';
import { Moment } from '../../../../core/helperClasses/x-moment';
import { Observable } from 'rxjs';
import { IGeneralAsyncValidatorResponse } from '../../../xt-forms/validators/general-async-validator.directive';
import { AddressModel } from '../../../../core/models/address.model';
import { DocumentModel } from '../../../../core/models/document.model';
import { VaccineModel } from '../../../../core/models/vaccine.model';
import { CaseCenterDateRangeModel } from '../../../../core/models/case-center-date-range.model';
import { Params } from '@angular/router';
import { IAppFormIconButtonV2 } from '../../../forms-v2/core/app-form-icon-button-v2';
import { IV2Column } from '../../app-list-table-v2/models/column.model';
import { UserSettings } from '../../../../core/models/user.model';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { V2AdvancedFilter } from '../../app-list-table-v2/models/advanced-filter.model';
import { MapServerModel } from '../../../../core/models/map-server.model';
import { IAnswerData, QuestionModel } from '../../../../core/models/question.model';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { IGroupEventData, IGroupOptionEventData, ISelectGroupOptionFormatResponse, ISelectGroupOptionMap } from '../../../forms-v2/components/app-form-select-groups-v2/models/select-group.model';
import { LocationIdentifierModel } from '../../../../core/models/location-identifier.model';

/**
 * Input type
 */
export enum CreateViewModifyV2TabInputType {
  // inputs
  TEXT,
  WYSIWYG,
  EMAIL,
  PASSWORD,
  SELECT_SINGLE,
  SELECT_MULTIPLE,
  AGE_DATE_OF_BIRTH,
  ASYNC_VALIDATOR_TEXT,
  DATE,
  TOGGLE_CHECKBOX,
  LOCATION_SINGLE,
  LOCATION_MULTIPLE,
  TEXTAREA,
  NUMBER,
  SELECT_GROUPS,
  COLOR,

  // input groups
  LIST,
  LAT_LNG,
  LIST_TEXT,
  LOCATION_IDENTIFIER,
  DOCUMENT,
  ADDRESS,
  VACCINE,
  CENTER_DATE_RANGE,
  MAP_SERVER,

  // layout
  TAB,
  TAB_TABLE,
  TAB_TABLE_RECORDS_LIST,
  TAB_TABLE_EDIT_QUESTIONNAIRE,
  TAB_TABLE_FILL_QUESTIONNAIRE,
  SECTION,

  // other
  LABEL,
  LINK_LIST,
  LABEL_LIST
}

/**
 * Input - base value
 */
interface ICreateViewModifyV2TabInputValue<T> {
  get: (index?: number) => T;
  set: (value: T, index?: number) => void;
}

/**
 * Input - base
 */
interface ICreateViewModifyV2TabInputBase {
  // required
  type: CreateViewModifyV2TabInputType;
  name: string;
  placeholder: () => string;

  // optional
  description?: () => string;
  disabled?: (item: CreateViewModifyV2TabInput) => boolean;
  replace?: {
    condition: (item: CreateViewModifyV2TabInput) => boolean,
    html: string
  };
  noValueLabel?: () => string;

  // never
  value: never;
}

/**
 * Input - text
 */
interface ICreateViewModifyV2TabInputText extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.TEXT;
  value: ICreateViewModifyV2TabInputValue<string>;

  // optional
  validators?: {
    required?: () => boolean,
    regex?: () => {
      expression: string,
      flags?: string,
      msg?: string
    },
    notInObject?: () => {
      values: {
        [prop: string]: true
      },
      err: string
    }
  };
}

/**
 * Input - what you see is what you get
 */
interface ICreateViewModifyV2TabInputWYSIWYG extends Omit<ICreateViewModifyV2TabInputBase, 'value' | 'placeholder' | 'description'> {
  // required
  type: CreateViewModifyV2TabInputType.WYSIWYG;
  value: ICreateViewModifyV2TabInputValue<string>;
}

/**
 * Input - color
 */
interface ICreateViewModifyV2TabInputColor extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.COLOR;
  value: ICreateViewModifyV2TabInputValue<string>;
}

/**
 * Input - email
 */
interface ICreateViewModifyV2TabInputEmail extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.EMAIL;
  value: ICreateViewModifyV2TabInputValue<string>;

  // optional
  validators?: {
    required?: () => boolean
  };
}
/**
 * Input - async validator text
 */
interface ICreateViewModifyV2TabInputAsyncValidatorText extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.ASYNC_VALIDATOR_TEXT;
  value: ICreateViewModifyV2TabInputValue<string>;
  validators: {
    // required
    async: Observable<boolean | IGeneralAsyncValidatorResponse>,

    // optional
    required?: () => boolean
  };

  // optional
  suffixIconButtons?: IAppFormIconButtonV2[];
}

/**
 * Input - password
 */
interface ICreateViewModifyV2TabInputPassword extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.PASSWORD;
  value: ICreateViewModifyV2TabInputValue<string>;

  // optional
  validators?: {
    required?: () => boolean,
    minlength?: () => number,
    validateOther?: () => string,
    equalValidator?: () => {
      input: string,
      err: string
    }
  };
  suffixIconButtons?: IAppFormIconButtonV2[];
}

/**
 * Input - select single
 */
interface ICreateViewModifyV2TabInputSingleSelect extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.SELECT_SINGLE;
  options: ILabelValuePairModel[];
  value: ICreateViewModifyV2TabInputValue<string>;

  // optional
  validators?: {
    required?: () => boolean,
    validateOther?: () => string,
    notEqualValidator?: () => {
      input: string,
      err: string
    }
  };
}

/**
 * Input - select multiple
 */
interface ICreateViewModifyV2TabInputMultipleSelect extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.SELECT_MULTIPLE;
  options: ILabelValuePairModel[];
  value: ICreateViewModifyV2TabInputValue<string[]>;

  // optional
  validators?: {
    required?: () => boolean
  };
}

/**
 * Input - toggle checkbox
 */
interface ICreateViewModifyV2TabInputToggleCheckbox extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX;
  value: ICreateViewModifyV2TabInputValue<boolean>;
}

/**
 * Input - location single
 */
interface ICreateViewModifyV2TabInputLocationSingle extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.LOCATION_SINGLE;
  value: ICreateViewModifyV2TabInputValue<string>;

  // optional
  useOutbreakLocations?: boolean;
  excludeLocationsIds?: string[];
}

/**
 * Input - location multiple
 */
interface ICreateViewModifyV2TabInputLocationMultiple extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.LOCATION_MULTIPLE;
  value: ICreateViewModifyV2TabInputValue<string[]>;

  // optional
  useOutbreakLocations?: boolean;
  validators?: {
    required?: () => boolean
  };
}

/**
 * Input - textarea
 */
interface ICreateViewModifyV2TabInputTextArea extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.TEXTAREA;
  value: ICreateViewModifyV2TabInputValue<string>;
}

/**
 * Input - number
 */
interface ICreateViewModifyV2TabInputNumber extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.NUMBER;
  value: ICreateViewModifyV2TabInputValue<number>;

  // optional
  validators?: {
    required?: () => boolean
  };
}

/**
 * Input - select group
 */
interface ICreateViewModifyV2TabInputSelectGroups extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.SELECT_GROUPS;
  value: ICreateViewModifyV2TabInputValue<string[]>;
  groups: any[];
  groupLabelKey: string;
  groupValueKey: string;
  groupOptionsKey: string;
  groupOptionLabelKey: string;
  groupOptionValueKey: string;
  groupNoneLabel: string;
  groupPartialLabel: string;
  groupAllLabel: string;
  groupTooltipKey: string;
  groupOptionTooltipKey: string;
  groupNoneTooltip: string;
  groupPartialTooltip: string;
  groupAllTooltip: string;
  groupOptionHiddenKey: string;
  defaultValues: any[];
  groupOptionFormatMethod: (
    sanitized: DomSanitizer,
    i18nService: TranslateService,
    optionsMap: ISelectGroupOptionMap<any>,
    option: any
  ) => ISelectGroupOptionFormatResponse;
  groupSelectionChanged: (data: IGroupEventData) => void;
  groupOptionCheckStateChanged: (data: IGroupOptionEventData) => void;
  appGroupOptionsRequirementsKey: string;
  requiredWithoutDefaultValues: boolean;

  // optional
  validators?: {
    required?: () => boolean
  };
}

/**
 * Input - age - date of birth
 */
interface ICreateViewModifyV2TabInputAgeOrDOB extends Omit<ICreateViewModifyV2TabInputBase, 'name' | 'placeholder' | 'description' | 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.AGE_DATE_OF_BIRTH;
  name: {
    age: string,
    dob: string
  },
  ageChecked: boolean,
  ageTypeYears: boolean,
  value: {
    age: {
      years: ICreateViewModifyV2TabInputValue<number>,
      months: ICreateViewModifyV2TabInputValue<number>
    },
    dob: ICreateViewModifyV2TabInputValue<string | Moment>
  },

  // optional
  description?: {
    age: string,
    dob: string
  }
}

/**
 * Input - date
 */
interface ICreateViewModifyV2TabInputDate extends Omit<ICreateViewModifyV2TabInputBase, 'value'> {
  // required
  type: CreateViewModifyV2TabInputType.DATE;
  value: ICreateViewModifyV2TabInputValue<string | Moment>;

  // optional
  validators?: {
    required?: () => boolean,
    dateSameOrBefore?: () => (Moment | string)[],
    dateSameOrAfter?: () => (Moment | string)[]
  }
  minDate?: Moment | string;
  maxDate?: Moment | string;
}

/**
* Input - list
*/
export interface ICreateViewModifyV2TabInputList {
  // required
  type: CreateViewModifyV2TabInputType.LIST;
  name: string;
  items: any[];
  definition: {
    input: CreateViewModifyV2TabInput,
    add: {
      label: string,
      newItem: () => any
    },
    remove: {
      label: string,
      confirmLabel: string
    }
  };
  itemsChanged: (list: ICreateViewModifyV2TabInputList) => void;

  // optional
  sortable?: boolean;
  readonly?: boolean;
}

/**
 * Input - latitude / longitude
 */
interface ICreateViewModifyV2TabInputLatLng {
  // required
  type: CreateViewModifyV2TabInputType.LAT_LNG;
  name: string;
  value: {
    get: () => { lat: number, lng: number }
  };
}

/**
 * Input - list text
 */
interface ICreateViewModifyV2TabInputListText {
  // required
  type: CreateViewModifyV2TabInputType.LIST_TEXT;

  // optional
  placeholder: () => string;
  description?: () => string;
  disabled?: (item: CreateViewModifyV2TabInput) => boolean;
}

/**
 * Input - location identifier
 */
interface ICreateViewModifyV2TabInputLocationIdentifier {
  // required
  type: CreateViewModifyV2TabInputType.LOCATION_IDENTIFIER;
  value: {
    get: (index?: number) => LocationIdentifierModel;
  };
}

/**
 * Input - document
 */
interface ICreateViewModifyV2TabInputDocument {
  // required
  type: CreateViewModifyV2TabInputType.DOCUMENT;
  typeOptions: ILabelValuePairModel[];
  value: {
    get: (index?: number) => DocumentModel;
  };
}

/**
 * Input - address
 */
interface ICreateViewModifyV2TabInputAddress {
  // required
  type: CreateViewModifyV2TabInputType.ADDRESS;
  typeOptions: ILabelValuePairModel[];
  value: {
    get: (index?: number) => AddressModel;
  };

  // optional
  name?: string; // used for single address - event
  validators?: {
    required?: () => boolean
  };
}

/**
 * Input - vaccine
 */
interface ICreateViewModifyV2TabInputVaccine {
  // required
  type: CreateViewModifyV2TabInputType.VACCINE;
  vaccineOptions: ILabelValuePairModel[];
  vaccineStatusOptions: ILabelValuePairModel[];
  value: {
    get: (index?: number) => VaccineModel;
  };
}

/**
 * Input - center date range
 */
interface ICreateViewModifyV2TabInputCenterDateRange {
  // required
  type: CreateViewModifyV2TabInputType.CENTER_DATE_RANGE;
  typeOptions: ILabelValuePairModel[];
  centerOptions: ILabelValuePairModel[];
  value: {
    get: (index?: number) => CaseCenterDateRangeModel;
  };

  // optional
  startDateValidators?: {
    dateSameOrAfter?: () => (Moment | string)[]
  }
}

/**
 * Input - map server
 */
interface ICreateViewModifyV2TabInputMapServer {
  // required
  type: CreateViewModifyV2TabInputType.MAP_SERVER;
  vectorTypeOptions: ILabelValuePairModel[];
  styleSourceOptions: {
    [url: string]: ILabelValuePairModel[]
  };
  value: {
    get: (index?: number) => MapServerModel;
  };
  styleAsyncValidator: (
    input: ICreateViewModifyV2TabInputMapServer,
    index: number
  ) => Observable<boolean | IGeneralAsyncValidatorResponse>;
}

/**
 * Input - label
 */
interface ICreateViewModifyV2TabLabel {
  // required
  type: CreateViewModifyV2TabInputType.LABEL;
  value: {
    get: () => string
  };

  // optional
  visible?: () => boolean;
}

/**
 * Input - link list
 */
interface ICreateViewModifyV2TabLinkList {
  // required
  type: CreateViewModifyV2TabInputType.LINK_LIST;
  label: {
    get: () => string
  };
  links: {
    label: string;
    action: ICreateViewModifyV2Link;
  }[];
}

/**
 * Input - label list
 */
interface ICreateViewModifyV2TabLabelList {
  // required
  type: CreateViewModifyV2TabInputType.LABEL_LIST;
  label: {
    get: () => string
  };
  labels: string[];
}

/**
 * Input
 */
export type CreateViewModifyV2TabInput = ICreateViewModifyV2TabInputText | ICreateViewModifyV2TabInputWYSIWYG | ICreateViewModifyV2TabInputEmail
| ICreateViewModifyV2TabInputPassword | ICreateViewModifyV2TabInputSingleSelect | ICreateViewModifyV2TabInputMultipleSelect | ICreateViewModifyV2TabInputToggleCheckbox
| ICreateViewModifyV2TabInputLocationSingle | ICreateViewModifyV2TabInputLocationMultiple | ICreateViewModifyV2TabInputTextArea
| ICreateViewModifyV2TabInputNumber | ICreateViewModifyV2TabInputSelectGroups | ICreateViewModifyV2TabInputAgeOrDOB
| ICreateViewModifyV2TabInputAsyncValidatorText | ICreateViewModifyV2TabInputColor | ICreateViewModifyV2TabInputDate
| ICreateViewModifyV2TabInputList | ICreateViewModifyV2TabInputLatLng | ICreateViewModifyV2TabInputListText | ICreateViewModifyV2TabInputLocationIdentifier
| ICreateViewModifyV2TabInputDocument | ICreateViewModifyV2TabInputAddress | ICreateViewModifyV2TabInputVaccine
| ICreateViewModifyV2TabInputCenterDateRange | ICreateViewModifyV2TabInputMapServer | ICreateViewModifyV2TabLabel | ICreateViewModifyV2TabLinkList
| ICreateViewModifyV2TabLabelList;

/**
 * Tab section
 */
interface ICreateViewModifyV2Section {
  // required
  type: CreateViewModifyV2TabInputType.SECTION;
  inputs: CreateViewModifyV2TabInput[];
  label: string;

  // optional
  visible?: () => boolean;
}

/**
 * Tab
 */
export interface ICreateViewModifyV2Tab {
  // required
  type: CreateViewModifyV2TabInputType.TAB;
  label: string;
  sections: ICreateViewModifyV2Section[];

  // optional
  visible?: () => boolean
  form?: NgForm;
  invalidHTMLSuffix?: (tab: ICreateViewModifyV2Tab) => string;
}

/**
 * Tab table - list of records
 */
export interface ICreateViewModifyV2TabTableRecordsList {
  // required
  type: CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST;
  tableColumns: IV2Column[];
  pageSettingsKey: UserSettings;
  advancedFilterType: string;
  advancedFilters: V2AdvancedFilter[];
  refresh: (tab: ICreateViewModifyV2TabTable) => void;
  refreshCount: (
    tab: ICreateViewModifyV2TabTable,
    applyHasMoreLimit?: boolean
  ) => void;
  pageIndex: number;

  // used by ui
  updateUI?: () => void;
  records$?: Observable<any[]>;
  queryBuilder?: RequestQueryBuilder;
  applyHasMoreLimit?: boolean;
  pageCount?: IBasicCount;
  previousRefreshRequest?: any;
}

/**
 * Tab table - edit questionnaire
 */
interface ICreateViewModifyV2TabTableEditQuestionnaire {
  // required
  type: CreateViewModifyV2TabInputType.TAB_TABLE_EDIT_QUESTIONNAIRE;
  name: string;
  value: ICreateViewModifyV2TabInputValue<QuestionModel[]>;
}

/**
 * Tab table - fill questionnaire
 */
interface ICreateViewModifyV2TabTableFillQuestionnaire {
  // required
  type: CreateViewModifyV2TabInputType.TAB_TABLE_FILL_QUESTIONNAIRE;
  name: string;
  value: ICreateViewModifyV2TabInputValue<{
    [variable: string]: IAnswerData[];
  }>;
  questionnaire: QuestionModel[];
  updateErrors: (errorsHTML: string) => void;

  // optional
  disableValidation?: boolean;
}

/**
 * Tab table
 */
export interface ICreateViewModifyV2TabTable {
  // required
  type: CreateViewModifyV2TabInputType.TAB_TABLE;
  label: string;
  definition: ICreateViewModifyV2TabTableRecordsList | ICreateViewModifyV2TabTableEditQuestionnaire | ICreateViewModifyV2TabTableFillQuestionnaire;

  // optional
  visible?: () => boolean
  form?: NgForm;
  invalidHTMLSuffix?: (tab: ICreateViewModifyV2TabTable) => string;
}

/**
 * Link
 */
interface ICreateViewModifyV2Link {
  // required
  link: () => string[];

  // optional
  queryParams?: () => Params;

  // never
  click?: never;
}

/**
 * Click
 */
interface ICreateViewModifyV2Click {
  // required
  click: () => void;

  // never
  link?: never;
  queryParams?: never;
}

/**
 * Menu type
 */
export enum CreateViewModifyV2MenuType {
  GROUP,
  OPTION,
  DIVIDER
}

/**
 * Menu group
 */
interface ICreateViewModifyV2MenuGroup {
  // menu option
  type: CreateViewModifyV2MenuType.GROUP;
  label: string;

  // optional
  visible?: () => boolean;

  // never
  action?: never;
}

/**
 * Menu option
 */
interface ICreateViewModifyV2MenuOption {
  // menu option
  type: CreateViewModifyV2MenuType.OPTION;
  label: string;
  action: ICreateViewModifyV2Link | ICreateViewModifyV2Click;

  // optional
  visible?: () => boolean;
}

/**
 * Menu divider
 */
interface ICreateViewModifyV2MenuDivider {
  // optional
  type: CreateViewModifyV2MenuType.DIVIDER;
  visible?: () => boolean;

  // never
  label?: never;
  action?: never;
}

/**
 * Menu types
 */
interface ICreateViewModifyV2Menu {
  // required
  options: (ICreateViewModifyV2MenuGroup | ICreateViewModifyV2MenuOption | ICreateViewModifyV2MenuDivider)[]
}

/**
 * Button
 */
interface ICreateViewModifyV2LinkButton {
  // required
  link: ICreateViewModifyV2Link;

  // optional
  visible?: () => boolean;
}

/**
 * Create view modify data - create or update
 */
export enum CreateViewModifyV2ActionType {
  CREATE,
  UPDATE
}

/**
 * Create view modify buttons
 */
export interface ICreateViewModifyV2Buttons {
  view: ICreateViewModifyV2LinkButton,
  modify: ICreateViewModifyV2LinkButton,
  createCancel: ICreateViewModifyV2LinkButton,
  viewCancel: ICreateViewModifyV2LinkButton,
  modifyCancel: ICreateViewModifyV2LinkButton,
  quickActions?: ICreateViewModifyV2Menu
}

/**
 * Create view modify process data
 */
export type ICreateViewModifyV2CreateOrUpdate = (
  type: CreateViewModifyV2ActionType,
  data: any,
  finished: (error: any, data: any) => void,
  loading: {
    show: () => void
    hide: () => void
  },
  forms: {
    markFormsAsPristine: () => void
  }
) => void;

/**
 * Create view modify data
 */
export interface ICreateViewModifyV2 {
  // required
  tabs: (ICreateViewModifyV2Tab | ICreateViewModifyV2TabTable)[];
  create: {
    finalStep: {
      buttonLabel: string,
      message: () => string
    }
  };
  buttons: ICreateViewModifyV2Buttons;
  createOrUpdate: ICreateViewModifyV2CreateOrUpdate;
  redirectAfterCreateUpdate: (data: any) => void;

  // optional
  modifyGetAllNotOnlyDirtyFields?: boolean;
}
