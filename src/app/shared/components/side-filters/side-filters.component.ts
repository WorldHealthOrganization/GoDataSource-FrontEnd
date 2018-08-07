import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSidenav } from '@angular/material';
import { AppliedFilterModel, FilterType, FilterModel } from './model';
import { RequestFilterOperator, RequestQueryBuilder } from '../../../core/helperClasses/request-query-builder';
import { NgForm } from '@angular/forms';
import { FormHelperService } from '../../../core/services/helper/form-helper.service';
import * as _ from 'lodash';

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
    selectedColumns: string[] = [];
    // applied filters
    appliedFilters: AppliedFilterModel[] = [new AppliedFilterModel()];
    // selected operator to be used between filters
    appliedFilterOperator: RequestFilterOperator = RequestFilterOperator.AND;
    // applied sorting criterias
    appliedSort: any[] = [];

    // provide constants to template
    RequestFilterOperator = RequestFilterOperator;
    FilterType = FilterType;

    @ViewChild('sideNav') sideNav: MatSidenav;

    constructor(
        private formHelper: FormHelperService
    ) {}

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
        _.each(filters, (appliedFilter) => {
            const filter: FilterModel = appliedFilter.filter;

            switch (filter.type) {
                case FilterType.TEXT:
                    queryBuilder.filter.byText(filter.fieldName, appliedFilter.value, false);
                    break;

                case FilterType.RANGE:
                    queryBuilder.filter.byRange(filter.fieldName, appliedFilter.value, false);
                    break;

                case FilterType.SELECT:
                case FilterType.MULTISELECT:
                    queryBuilder.filter.bySelect(filter.fieldName, appliedFilter.value, false);
                    break;
            }
        });

        // emit the Request Query Builder
        this.filtersApplied.emit(_.cloneDeep(queryBuilder));

        this.closeSideNav();
    }
}
