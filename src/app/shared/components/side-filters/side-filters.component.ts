import { Component, EventEmitter, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSidenav } from '@angular/material';
import { AppliedFilterModel, FilterType, FilterModel, FilterComparator } from './model';
import { RequestFilterOperator, RequestQueryBuilder } from '../../../core/helperClasses/request-query-builder';
import { NgForm } from '@angular/forms';
import { FormHelperService } from '../../../core/services/helper/form-helper.service';
import * as _ from 'lodash';
import { AddressModel } from '../../../core/models/address.model';

@Component({
    selector: 'app-side-filters',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './side-filters.component.html',
    styleUrls: ['./side-filters.component.less']
})
export class SideFiltersComponent {

    // available columns to be displayed
    @Input() columns: any[] = [];
    // available filters to be applied
    @Input() filterOptions: FilterModel[] = [];
    // available sort options to be applied
    @Input() sortOptions: any[] = [];

    @Output() filtersApplied = new EventEmitter<RequestQueryBuilder>();

    // selected columns for being displayed
    selectedColumns: string[];
    // applied filters
    appliedFilters: AppliedFilterModel[];
    // selected operator to be used between filters
    appliedFilterOperator: RequestFilterOperator;
    // applied sorting criteria
    appliedSort: any[];

    // provide constants to template
    RequestFilterOperator = RequestFilterOperator;
    FilterType = FilterType;
    FilterComparator = FilterComparator;

    // keep query builder
    queryBuilder: RequestQueryBuilder;

    @ViewChild('sideNav') sideNav: MatSidenav;

    constructor(
        private formHelper: FormHelperService
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
        this.selectedColumns = [];
        this.appliedFilters = [new AppliedFilterModel()];
        this.appliedFilterOperator = RequestFilterOperator.AND;
        this.appliedSort = [];
    }

    reset() {
        this.clear();
        this.queryBuilder = new RequestQueryBuilder();
        this.filtersApplied.emit(this.getQueryBuilder());

        this.closeSideNav();
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
        _.each(filters, (appliedFilter: AppliedFilterModel) => {
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

            // do we need to merge extra conditions ?
            if (appliedFilter.filter.extraConditions) {
                qb.merge(_.cloneDeep(appliedFilter.filter.extraConditions));
            }

            // filter
            switch (filter.type) {
                case FilterType.TEXT:
                    switch (comparator) {
                        case FilterComparator.IS:
                            qb.filter.byEquality(filter.fieldName, appliedFilter.value, false);
                            break;

                        // FilterComparator.TEXT_STARTS_WITH
                        default:
                            qb.filter.byText(filter.fieldName, appliedFilter.value, false);
                    }
                    break;

                case FilterType.ADDRESS:
                    // contains / within
                    switch (comparator) {
                        case FilterComparator.WITHIN:
                            // #TODO - near not working because of some issues with loopback & mongo
                            // #TODO also we need to replace lat and lng with real values pulled from somewhere...or allow user to enter / select the location...
                            qb.filter.where({
                                [`${filter.fieldName}.geoLocation`]: {
                                    near: {
                                        lat: 42.266271, // #TODO
                                        lng: -72.6700016 // #TODO
                                    },
                                    maxDistance: appliedFilter.value.to
                                }
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

                case FilterType.RANGE_DATE:
                    // between / before / after
                    qb.filter.byDateRange(filter.fieldName, appliedFilter.value, false);
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
        });

        // emit the Request Query Builder
        this.queryBuilder = queryBuilder;
        this.filtersApplied.emit(this.getQueryBuilder());

        this.closeSideNav();
    }
}
