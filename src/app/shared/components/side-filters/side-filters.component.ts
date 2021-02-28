import { Component, EventEmitter, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MatSidenav } from '@angular/material';
import { AppliedFilterModel, AppliedSortModel, FilterComparator, FilterModel, FilterType, QuestionSideFilterModel, QuestionWhichAnswer, SortModel } from './model';
import { RequestFilterGenerator, RequestFilterOperator, RequestQueryBuilder, RequestSortDirection } from '../../../core/helperClasses/request-query-builder';
import { NgForm } from '@angular/forms';
import { FormHelperService } from '../../../core/services/helper/form-helper.service';
import * as _ from 'lodash';
import { AddressModel } from '../../../core/models/address.model';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { Constants } from '../../../core/models/constants';
import { SavedFiltersService } from '../../../core/services/data/saved-filters.data.service';
import { DialogService } from '../../../core/services/helper/dialog.service';
import { DialogAnswer, DialogAnswerButton, DialogButton, DialogComponent, DialogConfiguration, DialogField, DialogFieldType } from '../dialog/dialog.component';
import { SavedFilterData, SavedFilterDataAppliedFilter, SavedFilterDataAppliedSort, SavedFilterModel } from '../../../core/models/saved-filters.model';
import { SnackbarService } from '../../../core/services/helper/snackbar.service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { moment } from '../../../core/helperClasses/x-moment';
import { LabelValuePair } from '../../../core/models/label-value-pair';
import { DateRangeModel } from '../../../core/models/date-range.model';
import { of } from 'rxjs/internal/observable/of';

@Component({
    selector: 'app-side-filters',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './side-filters.component.html',
    styleUrls: ['./side-filters.component.less']
})
export class SideFiltersComponent {
    // available filters to be applied
    _filterOptions: FilterModel[] = [];
    @Input() set filterOptions(values: FilterModel[]) {
        // filter options
        // clone array since we alter it later
        this._filterOptions = values ? [
            ...values
        ] : values;

        // sort applied filters
        if (!_.isEmpty(this._filterOptions)) {
            this._filterOptions.sort((item1: FilterModel, item2: FilterModel): number => {
                // get names
                let name1: string = this.i18nService.instant(item1.fieldLabel).toLowerCase();
                let name2: string = this.i18nService.instant(item2.fieldLabel).toLowerCase();

                // add prefix ?
                if (item1.relationshipLabel) {
                    name1 = `${this.i18nService.instant(item1.relationshipLabel).toLowerCase()} ${name1}`;
                }
                if (item2.relationshipLabel) {
                    name2 = `${this.i18nService.instant(item2.relationshipLabel).toLowerCase()} ${name2}`;
                }

                // compare
                return name1.localeCompare(name2);
            });
        }

        // required applied fields
        this.addRequiredAndValueFilters();

        // sort options
        this.updateSortFields();
    }

    get filterOptions(): FilterModel[] {
        return this._filterOptions;
    }

    // available sort options to be applied
    sortOptions: SortModel[] = [];

    // extra sort options from the ones provided in the filters
    _extraSortOptions: SortModel[] = [];
    @Input() set extraSortOptions(values: SortModel[]) {
        // extra options
        this._extraSortOptions = values;

        // sort options
        this.updateSortFields();
    }

    get extraSortOptions(): SortModel[] {
        return this._extraSortOptions;
    }

    // apply filters handler
    @Output() filtersApplied = new EventEmitter<RequestQueryBuilder>();
    @Output() filtersCollected = new EventEmitter<AppliedFilterModel[]>();

    /**
     * Form
     */
    @ViewChild('form') form: NgForm;

    /**
     * Fixed filters ( can' add other filters, can't change operator..etc) ?
     */
    @Input() fixedFilters: boolean = false;

    // get saved filters type
    private _savedFiltersType: string;
    @Input() set savedFiltersType(savedFiltersType: string) {
        // set filter
        this._savedFiltersType = savedFiltersType;

        // update data
        this.getAvailableSavedFilters();
    }
    get savedFiltersType(): string {
        return this._savedFiltersType;
    }
    savedFilters$: Observable<SavedFilterModel[]>;

    // applied filters
    appliedFilters: AppliedFilterModel[];
    // selected operator to be used between filters
    appliedFilterOperator: RequestFilterOperator;
    // applied sorting criteria
    appliedSort: AppliedSortModel[];

    // provide constants to template
    RequestFilterOperator = RequestFilterOperator;
    FilterType = FilterType;
    FilterComparator = FilterComparator;
    AppliedFilterModel = AppliedFilterModel;
    Constants = Constants;

    // keep query builder
    queryBuilder: RequestQueryBuilder;

    // sort directions
    sortDirections: any[] = [
        {label: 'LNG_SIDE_FILTERS_SORT_BY_ASC_PLACEHOLDER', value: RequestSortDirection.ASC},
        {label: 'LNG_SIDE_FILTERS_SORT_BY_DESC_PLACEHOLDER', value: RequestSortDirection.DESC}
    ];

    // which types of question
    questionWhichAnswerOptions: LabelValuePair[] = [
        new LabelValuePair(
            'LNG_SIDE_FILTERS_COMPARATOR_LABEL_QUESTION_WHICH_ANSWER_ANY',
            QuestionWhichAnswer.ANY_ANSWER
        ),
        new LabelValuePair(
            'LNG_SIDE_FILTERS_COMPARATOR_LABEL_QUESTION_WHICH_ANSWER_LAST',
            QuestionWhichAnswer.LAST_ANSWER
        )
    ];

    @ViewChild('sideNav') sideNav: MatSidenav;

    // loaded filter
    loadedFilter: SavedFilterModel;

    constructor(
        private formHelper: FormHelperService,
        private i18nService: I18nService,
        private savedFiltersService: SavedFiltersService,
        private dialogService: DialogService,
        private snackbarService: SnackbarService,
        private savedFilterService: SavedFiltersService
    ) {
        // initialize data
        this.clear();
    }

    addFilter() {
        this.appliedFilters.push(new AppliedFilterModel());
    }

    deleteFilter(index) {
        this.appliedFilters.splice(index, 1);
    }

    addSort() {
        this.appliedSort.push(new AppliedSortModel());
    }

    deleteSort(index) {
        this.appliedSort.splice(index, 1);
    }

    /**
     * Get available saved side filters
     */
    getAvailableSavedFilters() {
        // no need to retrieve filters for empty key
        if (!this.savedFiltersType) {
            this.savedFilters$ = of([]);
            return;
        }

        // retrieve saved filters
        const qb = new RequestQueryBuilder();
        qb.filter.where({
            filterKey: {
                eq: this.savedFiltersType
            }
        });
        this.savedFilters$ = this.savedFilterService.getSavedFiltersList(qb);
    }

    /**
     * Save a filter
     */
    saveFilter() {
        // can't save empty filter
        if (!this.savedFiltersType) {
            return;
        }

        // refresh
        const createFilter = () => {
            // create
            this.dialogService
                .showInput(
                    new DialogConfiguration({
                        message: 'LNG_DIALOG_SAVE_FILTERS_TITLE',
                        yesLabel: 'LNG_SIDE_FILTERS_SAVE_FILTER_BUTTON',
                        required: true,
                        fieldsList: [
                            new DialogField({
                                name: 'filterName',
                                placeholder: 'LNG_SAVED_FILTERS_FIELD_LABEL_NAME',
                                description: 'LNG_SAVED_FILTERS_FIELD_LABEL_NAME_DESCRIPTION',
                                required: true,
                                fieldType: DialogFieldType.TEXT,
                            }),
                            new DialogField({
                                name: 'isPublic',
                                placeholder: 'LNG_SAVED_FILTERS_FIELD_LABEL_PUBLIC',
                                fieldType: DialogFieldType.BOOLEAN
                            })
                        ]
                    }), true)
                .subscribe((answer: DialogAnswer) => {
                    if (answer.button === DialogAnswerButton.Yes) {
                        this.savedFiltersService.createFilter(
                            new SavedFilterModel({
                                name: answer.inputValue.value.filterName,
                                isPublic: answer.inputValue.value.isPublic,
                                filterKey: this.savedFiltersType,
                                filterData: this.toSaveData()
                            })
                        )
                            .pipe(
                                catchError((err) => {
                                    this.snackbarService.showApiError(err);
                                    return throwError(err);
                                })
                            )
                            .subscribe((data) => {
                                // select this filter
                                this.loadedFilter = new SavedFilterModel(data);

                                // update filters
                                this.getAvailableSavedFilters();

                                // display message
                                this.snackbarService.showSuccess('LNG_SIDE_FILTERS_SAVE_FILTER_SUCCESS_MESSAGE');
                            });
                    }
                });
        };

        // create / update ?
        if (
            this.loadedFilter &&
            this.loadedFilter.id &&
            !this.loadedFilter.readOnly
        ) {
            // ask user if he wants to overwrite the filter with new settings
            this.dialogService
                .showConfirm(new DialogConfiguration({
                    message: 'LNG_DIALOG_SAVE_FILTERS_UPDATE_OR_CREATE_TITLE',
                    yesLabel: 'LNG_COMMON_BUTTON_UPDATE',
                    addDefaultButtons: true,
                    buttons: [
                        new DialogButton({
                            clickCallback: (dialogHandler: MatDialogRef<DialogComponent>) => {
                                dialogHandler.close(new DialogAnswer(DialogAnswerButton.Extra_1));
                            },
                            label: 'LNG_COMMON_BUTTON_CREATE'
                        })
                    ]
                }), {
                    filter: this.loadedFilter.name
                })
                .subscribe((answer) => {
                    if (answer.button === DialogAnswerButton.Yes) {
                        // update
                        this.savedFiltersService.modifyFilter(
                            this.loadedFilter.id, {
                                filterData: this.toSaveData()
                            }
                        )
                            .pipe(
                                catchError((err) => {
                                    this.snackbarService.showApiError(err);
                                    return throwError(err);
                                })
                            )
                            .subscribe((data) => {
                                // select this filter
                                this.loadedFilter = new SavedFilterModel(data);

                                // update filters
                                this.getAvailableSavedFilters();

                                // display message
                                this.snackbarService.showSuccess('LNG_SIDE_FILTERS_MODIFY_FILTER_SUCCESS_MESSAGE');
                            });
                    } else if (answer.button === DialogAnswerButton.Extra_1) {
                        createFilter();
                    }
                });
        } else {
            createFilter();
        }
    }

    /**
     * Convert query builder to an object that we can save in db
     */
    toSaveData(): SavedFilterData {
        // exclude required filters
        this.appliedFilters = _.filter(
            this.appliedFilters,
            (appliedFilter) => !appliedFilter.filter.required
        );

        // construct save data
        return new SavedFilterData({
            appliedFilters: _.map(
                this.appliedFilters,
                (filter: AppliedFilterModel) => filter.sanitizeForSave()
            ),
            appliedFilterOperator: this.appliedFilterOperator,
            appliedSort: _.map(
                this.appliedSort,
                (sort: AppliedSortModel) => sort.sanitizeForSave()
            ),
        });
    }

    /**
     * Apply a saved filter
     */
    loadSavedFilter(savedFilter: SavedFilterModel) {
        // keep loaded filter reference
        this.loadedFilter = savedFilter;

        // do we have a filter selected ?
        if (savedFilter) {
            // load filter
            this.clear(false);
            this.appliedFilterOperator = savedFilter.filterData.appliedFilterOperator as RequestFilterOperator;
            _.each(savedFilter.filterData.appliedFilters, (filter: SavedFilterDataAppliedFilter) => {
                // search through our current filters for our own filter
                const ourFilter = _.find(this.filterOptions, (filterOption: FilterModel) => filterOption.uniqueKey === filter.filter.uniqueKey);
                if (ourFilter) {
                    // create filter
                    this.appliedFilters.push(new AppliedFilterModel({
                        filter: ourFilter,
                        comparator: filter.comparator as FilterComparator,
                        value: filter.value,
                        extraValues: filter.extraValues
                    }));
                }
            });
            _.each(savedFilter.filterData.appliedSort, (sortCriteria: SavedFilterDataAppliedSort) => {
                // search through our current sort criterias for our own sort criteria
                const ourSort = _.find(this.sortOptions, (sortOption: SortModel) => sortOption.uniqueKey === sortCriteria.sort.uniqueKey);
                if (ourSort) {
                    this.appliedSort.push(new AppliedSortModel({
                        sort: ourSort,
                        direction: sortCriteria.direction as RequestSortDirection
                    }));
                }
            });
        }
    }

    /**
     * Change the operator to be used between the selected filters
     * @param {RequestFilterOperator} operator
     */
    setFilterOperator(operator: RequestFilterOperator) {
        this.appliedFilterOperator = operator;
    }

    /**
     * Check if an operator is the selected one to be used between filters
     * @param {RequestFilterOperator} operator
     * @returns {boolean}
     */
    isFilterOperator(operator: RequestFilterOperator) {
        return this.appliedFilterOperator === operator;
    }

    closeSideNav() {
        this.sideNav.close();
    }

    openSideNav() {
        this.sideNav.open();
    }

    getQueryBuilder(): RequestQueryBuilder {
        return this.queryBuilder ?
            _.cloneDeep(this.queryBuilder) :
            null;
    }

    clear(addFirstItem: boolean = true) {
        this.appliedFilterOperator = RequestFilterOperator.AND;
        this.appliedSort = [];
        this.addRequiredAndValueFilters(addFirstItem);
    }

    reset() {
        this.clear();
        this.loadedFilter = null;
        setTimeout(() => {
            this.apply(this.form);
        });
    }

    /**
     * Add filters resulted from filter options
     */
    private addRequiredAndValueFilters(addFirstItem: boolean = true) {
        // reinitialize applied filters
        this.appliedFilters = [];

        // go through filter options and add an applied filter for all required & value options
        _.each(this.filterOptions, (option: FilterModel) => {
            if (
                option.required ||
                option.value
            ) {
                // initialize filter
                const filter: AppliedFilterModel = new AppliedFilterModel({
                    readonly: option.required,
                    filter: option,
                    value:  _.isArray(option.value) || _.isObject(option.value) ?
                        _.cloneDeep(option.value) :
                        option.value
                });

                // add filter
                this.appliedFilters.push(filter);
            }
        });

        // if empty, then we need to add at least one empty applied field
        if (
            addFirstItem &&
            this.appliedFilters.length < 1
        ) {
            this.appliedFilters.push(new AppliedFilterModel());
        }
    }

    /**
     * Update sort fields
     */
    private updateSortFields() {
        this.sortOptions = [];

        // add filter sort fields
        const sortableFields = _.filter(this.filterOptions, (filter: FilterModel) => filter.sortable);
        _.each(sortableFields, (filter: FilterModel) => {
            // add only if no already in the list
            if (!_.includes(this.sortOptions, {fieldName: filter.fieldName})) {
                this.sortOptions.push(new SortModel(
                    filter.fieldName,
                    filter.fieldLabel
                ));
            }
        });

        // add filter extra sort fields
        _.each(this.extraSortOptions, (sort: SortModel) => {
            // add only if no already in the list
            if (!_.includes(this.sortOptions, {fieldName: sort.fieldName})) {
                this.sortOptions.push(sort);
            }
        });

        // sort items
        this.sortOptions = _.sortBy(this.sortOptions, (sort: SortModel) => {
            return this.i18nService.instant(sort.fieldLabel);
        });
    }

    apply(form: NgForm) {

        const fields: any = this.formHelper.getFields(form);

        // create a new Request Query Builder
        const queryBuilder = new RequestQueryBuilder();

        // apply filters
        const filters = _.filter(
            _.get(fields, 'filter.filters', []),
            'filter'
        );
        const filterOperator = _.get(fields, 'filter.operator', RequestFilterOperator.AND);

        // set operator
        queryBuilder.filter.setOperator(filterOperator);

        // set conditions
        const appliedFilters: AppliedFilterModel[] = [];
        _.each(filters, (appliedFilter: AppliedFilterModel) => {
            // construct list of applied filters
            appliedFilter = new AppliedFilterModel(appliedFilter);
            appliedFilters.push(appliedFilter);

            // there is no point in adding a condition if no value is provided
            if (
                (
                    appliedFilter.value === undefined ||
                    appliedFilter.value === null
                ) && (
                    appliedFilter.comparator !== FilterComparator.HAS_VALUE &&
                    appliedFilter.comparator !== FilterComparator.DOESNT_HAVE_VALUE
                )
            ) {
                return;
            }

            // data
            const filter: FilterModel = appliedFilter.filter;
            const comparator: FilterComparator = appliedFilter.comparator;

            // do we need to go into a relationship ?
            let qb: RequestQueryBuilder = queryBuilder;
            if (
                appliedFilter.filter.relationshipPath &&
                appliedFilter.filter.relationshipPath.length > 0
            ) {
                _.each(appliedFilter.filter.relationshipPath, (relation) => {
                    qb = qb.include(relation).queryBuilder;
                });
            }

            // children query builders
            if (appliedFilter.filter.childQueryBuilderKey) {
                qb = qb.addChildQueryBuilder(
                    appliedFilter.filter.childQueryBuilderKey,
                    false
                );
            }

            // do we need to merge extra conditions ?
            if (appliedFilter.filter.extraConditions) {
                qb.merge(_.cloneDeep(appliedFilter.filter.extraConditions));
            }

            // check if we need to flag value
            if (filter.flagIt) {
                // value ?
                let value;
                switch (filter.type) {
                    case FilterType.NUMBER:
                        value = _.isString(appliedFilter.value) && !_.isEmpty(appliedFilter.value) ? parseFloat(appliedFilter.value) : appliedFilter.value;
                        break;

                    default:
                        value = appliedFilter.value;
                }

                // add flag
                if (
                    !_.isEmpty(value) ||
                    _.isNumber(value)
                ) {
                    qb.filter.flag(
                        filter.fieldName,
                        value
                    );
                }
            } else {
                // filter
                let searchQb: RequestQueryBuilder;
                switch (filter.type) {
                    case FilterType.TEXT:
                        switch (comparator) {
                            case FilterComparator.IS:
                                qb.filter.byEquality(filter.fieldName, appliedFilter.value, false, true);
                                break;
                            case FilterComparator.CONTAINS_TEXT:
                                qb.filter.byContainingText(filter.fieldName, appliedFilter.value, false);
                                break;
                            case FilterComparator.HAS_VALUE:
                                qb.filter.byHasValue(
                                    filter.fieldName
                                );
                                break;
                            case FilterComparator.DOESNT_HAVE_VALUE:
                                qb.filter.byNotHavingValue(
                                    filter.fieldName
                                );
                                break;

                            // FilterComparator.TEXT_STARTS_WITH
                            default:
                                qb.filter.byText(filter.fieldName, appliedFilter.value, false);
                        }
                        break;

                    case FilterType.NUMBER:
                        switch (comparator) {
                            case FilterComparator.BEFORE:
                                qb.filter.where({
                                    [filter.fieldName]: {
                                        lte: _.isString(appliedFilter.value) ? parseFloat(appliedFilter.value) : appliedFilter.value
                                    }
                                });
                                break;
                            case FilterComparator.AFTER:
                                qb.filter.where({
                                    [filter.fieldName]: {
                                        gte: _.isString(appliedFilter.value) ? parseFloat(appliedFilter.value) : appliedFilter.value
                                    }
                                });
                                break;

                            // case FilterComparator.IS:
                            default:
                                qb.filter.byEquality(
                                    filter.fieldName,
                                    _.isString(appliedFilter.value) ? parseFloat(appliedFilter.value) : appliedFilter.value
                                );
                                break;
                        }
                        break;

                    case FilterType.ADDRESS:
                    case FilterType.LOCATION:
                        // contains / within
                        switch (comparator) {
                            case FilterComparator.LOCATION:
                                qb.filter.where({
                                    [`${filter.fieldName}.parentLocationIdFilter`]: {
                                        inq: appliedFilter.value
                                    }
                                });
                                break;

                            case FilterComparator.WITHIN:
                                // retrieve location lat & lng
                                const geoLocation = _.get(appliedFilter, 'extraValues.location.geoLocation', null);
                                const lat: number = geoLocation && (geoLocation.lat || geoLocation.lat === 0) ? parseFloat(geoLocation.lat) : null;
                                const lng: number = geoLocation && (geoLocation.lng || geoLocation.lng === 0) ? parseFloat(geoLocation.lng) : null;
                                if (
                                    lat === null ||
                                    lng === null
                                ) {
                                    break;
                                }

                                // construct near query
                                const nearQuery = {
                                    near: {
                                        lat: lat,
                                        lng: lng
                                    }
                                };

                                // add max distance if provided
                                const maxDistance: number = _.get(appliedFilter, 'extraValues.radius', null);
                                if (maxDistance !== null) {
                                    // convert miles to meters
                                    (nearQuery as any).maxDistance = Math.round(maxDistance * 1609.34);
                                }

                                // add filter
                                qb.filter.where({
                                    [`${filter.fieldName}.geoLocation`]: nearQuery
                                });
                                break;

                            // FilterComparator.CONTAINS
                            default:
                                // construct address search qb
                                searchQb = AddressModel.buildSearchFilter(
                                    appliedFilter.value,
                                    filter.fieldName,
                                    filter.addressFieldIsArray
                                );

                                // add condition if we were able to create it
                                if (searchQb) {
                                    qb.merge(searchQb);
                                }
                        }
                        break;

                    // filter by phone number
                    case FilterType.ADDRESS_PHONE_NUMBER:
                        // construct address phone number search qb
                        searchQb = AddressModel.buildPhoneSearchFilter(
                            appliedFilter.value,
                            filter.fieldName,
                            filter.addressFieldIsArray
                        );

                        // add condition if we were able to create it
                        if (searchQb) {
                            qb.merge(searchQb);
                        }
                        break;

                    case FilterType.RANGE_NUMBER:
                        switch (comparator) {
                            case FilterComparator.HAS_VALUE:
                                qb.filter.byHasValue(
                                    filter.fieldName
                                );
                                break;
                            case FilterComparator.DOESNT_HAVE_VALUE:
                                qb.filter.byNotHavingValue(
                                    filter.fieldName
                                );
                                break;

                            // others...
                            default:
                                // between / from / to
                                qb.filter.byRange(filter.fieldName, appliedFilter.value, false);
                        }
                        break;

                    case FilterType.RANGE_AGE:
                        // between / from / to
                        qb.filter.byAgeRange(filter.fieldName, appliedFilter.value, false);
                        break;

                    case FilterType.RANGE_DATE:
                        switch (comparator) {
                            case FilterComparator.HAS_VALUE:
                                qb.filter.byHasValue(
                                    filter.fieldName
                                );
                                break;
                            case FilterComparator.DOESNT_HAVE_VALUE:
                                qb.filter.byNotHavingValue(
                                    filter.fieldName
                                );
                                break;

                            // others...
                            default:
                                // between / before / after
                                qb.filter.byDateRange(filter.fieldName, appliedFilter.value, false);
                        }
                        break;

                    case FilterType.DATE:
                        // between
                        const date = _.isEmpty(appliedFilter.value) ?
                            null :
                            moment(appliedFilter.value);
                        qb.filter.byDateRange(
                            filter.fieldName,
                            date && date.isValid() ?
                                {
                                    startDate: date.startOf('day'),
                                    endDate: date.endOf('day')
                                } :
                                null,
                            false
                        );
                        break;

                    case FilterType.SELECT:
                    case FilterType.MULTISELECT:
                        switch (comparator) {
                            case FilterComparator.HAS_VALUE:
                                qb.filter.byHasValue(
                                    filter.fieldName
                                );
                                break;
                            case FilterComparator.DOESNT_HAVE_VALUE:
                                qb.filter.byNotHavingValue(
                                    filter.fieldName
                                );
                                break;

                            // FilterComparator.NONE
                            default:
                                qb.filter.bySelect(
                                    filter.fieldName,
                                    appliedFilter.value,
                                    false,
                                    null
                                );
                        }
                        break;

                    case FilterType.QUESTIONNAIRE_ANSWERS:
                        // get data
                        const question: QuestionSideFilterModel = appliedFilter.selectedQuestion;
                        const fieldName: string = filter.fieldName;
                        const whichAnswer: QuestionWhichAnswer = _.get(appliedFilter, 'extraValues.whichAnswer');
                        const extraComparator: FilterComparator = _.get(appliedFilter, 'extraValues.comparator');
                        const value: any = _.get(appliedFilter, 'extraValues.filterValue');
                        const whichAnswerDate: DateRangeModel = _.get(appliedFilter, 'extraValues.whichAnswerDate');

                        // we don't need to add filter if no filter value was provided
                        if (
                            question && (
                                !_.isEmpty(value) ||
                                _.isBoolean(value) ||
                                !_.isEmpty(whichAnswerDate) ||
                                extraComparator === FilterComparator.HAS_VALUE ||
                                extraComparator === FilterComparator.DOESNT_HAVE_VALUE
                            )
                        ) {
                            // construct answer date query
                            let dateQuery;
                            let valueQuery;
                            if (!_.isEmpty(whichAnswerDate)) {
                                dateQuery = RequestFilterGenerator.dateRangeCompare(whichAnswerDate);
                            }

                            // take action accordingly to question type
                            if (
                                !_.isEmpty(value) ||
                                _.isBoolean(value) ||
                                extraComparator === FilterComparator.HAS_VALUE ||
                                extraComparator === FilterComparator.DOESNT_HAVE_VALUE
                            ) {
                                switch (question.answerType) {
                                    // Text
                                    case Constants.ANSWER_TYPES.FREE_TEXT.value:
                                        switch (extraComparator) {
                                            case FilterComparator.IS:
                                                valueQuery = RequestFilterGenerator.textIs(value);
                                                break;
                                            case FilterComparator.CONTAINS_TEXT:
                                                valueQuery = RequestFilterGenerator.textContains(value);
                                                break;
                                            case FilterComparator.HAS_VALUE:
                                                valueQuery = RequestFilterGenerator.hasValue();
                                                break;
                                            case FilterComparator.DOESNT_HAVE_VALUE:
                                                // doesn't have value if handled bellow
                                                // NOTHING TO DO
                                                break;

                                            // FilterComparator.TEXT_STARTS_WITH
                                            default:
                                                valueQuery = RequestFilterGenerator.textStartWith(value);
                                        }

                                        // finished
                                        break;

                                    // Date
                                    case Constants.ANSWER_TYPES.DATE_TIME.value:
                                        switch (extraComparator) {
                                            case FilterComparator.HAS_VALUE:
                                                valueQuery = RequestFilterGenerator.hasValue();
                                                break;
                                            case FilterComparator.DOESNT_HAVE_VALUE:
                                                // doesn't have value if handled bellow
                                                // NOTHING TO DO
                                                break;

                                            // FilterComparator.TEXT_STARTS_WITH
                                            default:
                                                valueQuery = RequestFilterGenerator.dateRangeCompare(value);
                                        }

                                        // finished
                                        break;

                                    // Dropdown
                                    case Constants.ANSWER_TYPES.SINGLE_SELECTION.value:
                                    case Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value:
                                        switch (extraComparator) {
                                            case FilterComparator.HAS_VALUE:
                                                valueQuery = RequestFilterGenerator.hasValue();
                                                break;
                                            case FilterComparator.DOESNT_HAVE_VALUE:
                                                // doesn't have value if handled bellow
                                                // NOTHING TO DO
                                                break;

                                            // FilterComparator.TEXT_STARTS_WITH
                                            default:
                                                valueQuery = {
                                                    inq: value
                                                };
                                        }

                                        // finished
                                        break;

                                    // Number
                                    case Constants.ANSWER_TYPES.NUMERIC.value:
                                        switch (extraComparator) {
                                            case FilterComparator.HAS_VALUE:
                                                valueQuery = RequestFilterGenerator.hasValue();
                                                break;
                                            case FilterComparator.DOESNT_HAVE_VALUE:
                                                // doesn't have value if handled bellow
                                                // NOTHING TO DO
                                                break;

                                            // FilterComparator.TEXT_STARTS_WITH
                                            default:
                                                valueQuery = RequestFilterGenerator.rangeCompare(value);
                                        }

                                        // finished
                                        break;

                                    // File
                                    case Constants.ANSWER_TYPES.FILE_UPLOAD.value:
                                        // neq: null / $eq null doesn't work due to a mongodb bug ( the issue occurs when trying to filter an element from an array which is this case )
                                        switch (extraComparator) {
                                            case FilterComparator.HAS_VALUE:
                                                valueQuery = RequestFilterGenerator.hasValue();
                                                break;
                                            case FilterComparator.DOESNT_HAVE_VALUE:
                                                // doesn't have value if handled bellow
                                                // NOTHING TO DO
                                                break;
                                        }

                                        // finished
                                        break;
                                }
                            }

                            // search through all answers or just the last one ?
                            const query: any = {};
                            if (
                                !whichAnswer ||
                                whichAnswer === QuestionWhichAnswer.LAST_ANSWER
                            ) {
                                // do we need to attach a value condition as well ?
                                if (valueQuery) {
                                    query[`${fieldName}.${question.variable}.0.value`] = valueQuery;
                                } else if (extraComparator === FilterComparator.DOESNT_HAVE_VALUE) {
                                    // handle no value case
                                    const condition: any = RequestFilterGenerator.doesntHaveValue(`${fieldName}.${question.variable}.0.value`);
                                    const key: string = Object.keys(condition)[0];
                                    query[key] = condition[key];
                                }

                                // do we need to attach a date condition as well ?
                                if (dateQuery) {
                                    query[`${fieldName}.${question.variable}.0.date`] = dateQuery;
                                }

                                // register query
                                qb.filter.where(query);
                            } else {
                                // do we need to attach a value condition as well ?
                                if (valueQuery) {
                                    query.value = valueQuery;
                                } else if (extraComparator === FilterComparator.DOESNT_HAVE_VALUE) {
                                    // handle no value case
                                    const condition: any = RequestFilterGenerator.doesntHaveValue(
                                        'value',
                                        true
                                    );
                                    const key: string = Object.keys(condition)[0];
                                    query[key] = condition[key];
                                }

                                // do we need to attach a date condition as well ?
                                if (dateQuery) {
                                    query.date = dateQuery;
                                }

                                // add extra check if date not provided and we need to retrieve all records that don't have a value
                                if (
                                    !dateQuery &&
                                    extraComparator === FilterComparator.DOESNT_HAVE_VALUE
                                ) {
                                    qb.filter.where({
                                        or: [
                                            {
                                                [`${fieldName}.${question.variable}`]: {
                                                    $elemMatch: query
                                                }
                                            }, {
                                                [`${fieldName}.${question.variable}`]: {
                                                    exists: false
                                                }
                                            }, {
                                                [`${fieldName}.${question.variable}`]: {
                                                    type: 'null'
                                                }
                                            }, {
                                                [`${fieldName}.${question.variable}`]: {
                                                    size: 0
                                                }
                                            }
                                        ]
                                    });
                                } else {
                                    qb.filter.where({
                                        [`${fieldName}.${question.variable}`]: {
                                            $elemMatch: query
                                        }
                                    });
                                }
                            }
                        }

                        // finished
                        break;
                }
            }
        });

        // apply sort
        const sorts = _.filter(
            _.get(fields, 'sortBy.items', []),
            'sort'
        );

        // set sort by fields
        const objectDetailsSort: {
            [property: string]: string[]
        } = {
            age: ['years', 'months']
        };
        _.each(sorts, (appliedSort: AppliedSortModel) => {
            // add sorting criteria
            if (
                objectDetailsSort &&
                objectDetailsSort[appliedSort.sort.fieldName]
            ) {
                _.each(objectDetailsSort[appliedSort.sort.fieldName], (childProperty: string) => {
                    queryBuilder.sort.by(
                        `${appliedSort.sort.fieldName}.${childProperty}`,
                        appliedSort.direction
                    );
                });
            } else {
                queryBuilder.sort.by(
                    appliedSort.sort.fieldName,
                    appliedSort.direction
                );
            }
        });

        // emit the Request Query Builder
        this.queryBuilder = queryBuilder;
        this.filtersApplied.emit(this.getQueryBuilder());

        // send filters
        this.filtersCollected.emit(appliedFilters);

        // close side nav
        this.closeSideNav();
    }

    /**
     * Reset values on question change
     * @param filter
     */
    questionChanged(filter: AppliedFilterModel) {
        filter.extraValues = {};
    }

    /**
     * Which answer
     * @param filter
     */
    getQuestionExtraWhichAnswer(filter: AppliedFilterModel) {
        return filter.extraValues.whichAnswer || (
            filter.extraValues.whichAnswer = QuestionWhichAnswer.LAST_ANSWER
        );
    }

    /**
     * Which comparator
     * @param filter
     */
    getQuestionExtraComparator(filter: AppliedFilterModel) {
        return filter.extraValues.comparator || (
            filter.extraValues.comparator = (filter.selectedQuestion ? AppliedFilterModel.defaultComparator[AppliedFilterModel.allowedQuestionComparators[filter.selectedQuestion.answerType]] : null)
        );
    }
}
