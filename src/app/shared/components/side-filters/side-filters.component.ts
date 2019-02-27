import { Component, EventEmitter, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSidenav } from '@angular/material';
import { AppliedFilterModel, AppliedSortModel, FilterComparator, FilterModel, FilterType, SortModel } from './model';
import { RequestFilterOperator, RequestQueryBuilder, RequestSortDirection } from '../../../core/helperClasses/request-query-builder';
import { NgForm } from '@angular/forms';
import { FormHelperService } from '../../../core/services/helper/form-helper.service';
import * as _ from 'lodash';
import { AddressModel } from '../../../core/models/address.model';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { Constants } from '../../../core/models/constants';
import * as moment from 'moment';
import { SavedFiltersService } from '../../../core/services/data/saved-filters.service';
import { DialogService } from '../../../core/services/helper/dialog.service';
import { DialogAnswer, DialogConfiguration, DialogField, DialogFieldType } from '../dialog/dialog.component';
import { SavedFilterModel } from '../../../core/models/saved-filters.model';

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
    @Input() savedFilters: SavedFilterModel[];

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
        { label: 'LNG_SIDE_FILTERS_SORT_BY_ASC_PLACEHOLDER', value: RequestSortDirection.ASC },
        { label: 'LNG_SIDE_FILTERS_SORT_BY_DESC_PLACEHOLDER', value: RequestSortDirection.DESC }
    ];

    @ViewChild('sideNav') sideNav: MatSidenav;

    constructor(
        private formHelper: FormHelperService,
        private i18nService: I18nService,
        private savedFiltersService: SavedFiltersService,
        private dialogService: DialogService
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

    saveFilter() {
        console.log(this.getQueryBuilder());
        console.log(this.savedFiltersType);

        this.dialogService
            .showInput(
                new DialogConfiguration({
                    message: 'How do you want to name this filter?',
                    yesLabel: 'save filter',
                    required: true,
                    fieldsList: [
                        new DialogField({
                            name: 'filterName',
                            placeholder: 'Filter name',
                            required: true,
                            fieldType: DialogFieldType.TEXT,
                    }),
                        new DialogField({
                            name: 'isPublic',
                            placeholder: 'Make this filter public?',
                            required: true,
                            fieldType: DialogFieldType.BOOLEAN
                        })
                    ]
                }), true)
            .subscribe((answer: DialogAnswer) => {
                console.log(this.getQueryBuilder());
                console.log(answer);
                this.savedFiltersService.saveFilter(
                    new SavedFilterModel({
                        name: answer.inputValue.value.filterName,
                        isPublic: answer.inputValue.value.isPublic,
                        filterKey: this.savedFiltersType,
                        filterData: this.filterOptions.filter
                    })
                ).subscribe((data) => {
                    console.log(data);
                });
            });
        // this.savedFiltersService.saveFilter(this.filterOptions)
    }

    applySavedFilter(event) {
        console.log(event)
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

    clear() {
        this.appliedFilterOperator = RequestFilterOperator.AND;
        this.appliedSort = [];
        this.addRequiredAndValueFilters();
    }

    reset() {
        this.clear();
        setTimeout(() => {
            this.apply(this.form);
        });
    }

    /**
     * Add filters resulted from filter options
     */
    private addRequiredAndValueFilters() {
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
        if (this.appliedFilters.length < 1) {
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
            if (!_.includes(this.sortOptions, { fieldName: filter.fieldName })) {
                this.sortOptions.push(new SortModel(
                    filter.fieldName,
                    filter.fieldLabel
                ));
            }
        });

        // add filter extra sort fields
        _.each(this.extraSortOptions, (sort: SortModel) => {
            // add only if no already in the list
            if (!_.includes(this.sortOptions, { fieldName: sort.fieldName })) {
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
