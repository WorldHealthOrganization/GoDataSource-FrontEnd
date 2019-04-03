import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MatSidenav } from '@angular/material';
import { AppliedFilterModel, AppliedSortModel, FilterComparator, FilterModel, FilterType, SortModel } from './model';
import { RequestFilterOperator, RequestQueryBuilder, RequestSortDirection } from '../../../core/helperClasses/request-query-builder';
import { NgForm } from '@angular/forms';
import { FormHelperService } from '../../../core/services/helper/form-helper.service';
import * as _ from 'lodash';
import { AddressModel } from '../../../core/models/address.model';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { Constants } from '../../../core/models/constants';
import * as moment from 'moment';
import { SavedFiltersService } from '../../../core/services/data/saved-filters.data.service';
import { DialogService } from '../../../core/services/helper/dialog.service';
import { DialogAnswer, DialogAnswerButton, DialogButton, DialogComponent, DialogConfiguration, DialogField, DialogFieldType } from '../dialog/dialog.component';
import {
    SavedFilterData, SavedFilterDataAppliedFilter, SavedFilterDataAppliedSort,
    SavedFilterModel
} from '../../../core/models/saved-filters.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../core/services/helper/snackbar.service';
import { Observable } from 'rxjs';
import { RequestFilter } from '../../../core/helperClasses/request-query-builder/request-filter';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs/internal/observable/throwError';

@Component({
    selector: 'app-side-filters',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './side-filters.component.html',
    styleUrls: ['./side-filters.component.less']
})
export class SideFiltersComponent implements OnInit {
    // available filters to be applied
    _filterOptions: FilterModel[] = [];
    @Input() set filterOptions(values: FilterModel[]) {
        // filter options
        this._filterOptions = values;

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
    @Input() savedFiltersType: string;
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

    ngOnInit() {
        this.getAvailableSavedFilters();
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
        this.appliedFilters = _.filter(this.appliedFilters, appliedFilter => !appliedFilter.filter.required);

        return new SavedFilterData({
            appliedFilters: _.map(this.appliedFilters, (filter) => filter.sanitizeForSave()),
            appliedFilterOperator: this.appliedFilterOperator,
            appliedSort: _.map(this.appliedSort, (sort) => sort.sanitizeForSave()),
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
                    this.appliedFilters.push(new AppliedFilterModel({
                        filter: ourFilter,
                        comparator: filter.comparator as FilterComparator,
                        value: filter.value
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
                    value: option.value
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
        const filters = _.chain(fields)
            .get('filter.filters', [])
            .filter('filter')
            .value();
        const filterOperator = _.get(fields, 'filter.operator', RequestFilterOperator.AND);

        // set operator
        queryBuilder.filter.setOperator(filterOperator);

        // set conditions
        const appliedFilters: AppliedFilterModel[] = [];
        _.each(filters, (appliedFilter: AppliedFilterModel) => {
            // construct list of applied filters
            appliedFilters.push(new AppliedFilterModel(appliedFilter));

            // there is no point in adding a condition if no value is provided
            if (
                appliedFilter.value === undefined ||
                appliedFilter.value === null
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
                switch (filter.type) {
                    case FilterType.TEXT:
                        switch (comparator) {
                            case FilterComparator.IS:
                                qb.filter.byEquality(filter.fieldName, appliedFilter.value, false, true);
                                break;
                            case FilterComparator.CONTAINS_TEXT:
                                qb.filter.byContainingText(filter.fieldName, appliedFilter.value, false);
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
                                qb.merge(AddressModel.buildSearchFilter(appliedFilter.value, filter.fieldName));
                        }
                        break;

                    // filter by phone number
                    case FilterType.ADDRESS_PHONE_NUMBER:
                        qb.filter.where({
                            addresses: {
                                elemMatch: {
                                    phoneNumber: {
                                        $regex: RequestFilter.escapeStringForRegex(appliedFilter.value)
                                            .replace(/%/g, '.*')
                                            .replace(/\\\?/g, '.'),
                                        $options: 'i'
                                    }
                                }
                            }
                        });
                        break;

                    case FilterType.RANGE_NUMBER:
                        // between / from / to
                        qb.filter.byRange(filter.fieldName, appliedFilter.value, false);
                        break;

                    case FilterType.RANGE_AGE:
                        // between / from / to
                        qb.filter.byAgeRange(filter.fieldName, appliedFilter.value, false);
                        break;

                    case FilterType.RANGE_DATE:
                        // between / before / after
                        qb.filter.byDateRange(filter.fieldName, appliedFilter.value, false);
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
                        qb.filter.bySelect(
                            filter.fieldName,
                            appliedFilter.value,
                            false,
                            null
                        );
                        break;
                }
            }
        });

        // apply sort
        const sorts = _.chain(fields)
            .get('sortBy.items', [])
            .filter('sort')
            .value();

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
}
