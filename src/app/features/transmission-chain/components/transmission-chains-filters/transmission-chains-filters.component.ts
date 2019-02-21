import { Component, HostBinding, Input, ViewEncapsulation } from '@angular/core';
import { Moment } from 'moment';
import { AgeModel } from '../../../../core/models/age.model';
import { Observable } from 'rxjs/Observable';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import * as _ from 'lodash';

export class TransmissionChainFilters {
    classification: string;
    occupation: string;
    outcomeId: string;
    firstName: string;
    lastName: string;
    gender: string;
    locationId: string;
    age: AgeModel;
    date: Moment;

    /**
     * Constructor
     * @param data
     */
    constructor(data: {
        classification?: string,
        occupation?: string,
        outcomeId?: string,
        firstName?: string,
        lastName?: string,
        gender?: string,
        locationId?: string,
        age?: AgeModel,
        date?: Moment
    } = {}) {
        // assign properties
        Object.assign(
            this,
            data
        );
    }

    /**
     * Attach conditions to query builder
     */
    attachConditionsToRequestQueryBuilder(qb: RequestQueryBuilder) {
        // case classification
        if (!_.isEmpty(this.classification)) {
            qb.filter.byEquality(
                'classification',
                this.classification
            );
        }

        // occupation
        if (!_.isEmpty(this.occupation)) {
            qb.filter.byEquality(
                'occupation',
                this.occupation
            );
        }

        // outcome
        if (!_.isEmpty(this.outcomeId)) {
            qb.filter.byEquality(
                'outcomeId',
                this.outcomeId
            );
        }

        // firstName
        if (!_.isEmpty(this.firstName)) {
            qb.filter.byText(
                'firstName',
                this.firstName
            );
        }

        // lastName
        if (!_.isEmpty(this.lastName)) {
            qb.filter.byText(
                'lastName',
                this.lastName
            );
        }

        // gender
        if (!_.isEmpty(this.gender)) {
            qb.filter.bySelect(
                'gender',
                this.gender,
                true,
                null
            );
        }

        // case location
        if (!_.isEmpty(this.locationId)) {
            qb.filter.byEquality(
                'addresses.parentLocationIdFilter',
                this.locationId
            );
        }

        // age
        if (!_.isEmpty(this.age)) {
            qb.filter.byAgeRange(
                'age',
                this.age
            );
        }

        // date of reporting
        if (!_.isEmpty(this.date)) {
            qb.filter.byDateRange(
                'dateOfReporting',
                this.date
            );
        }
    }
}

@Component({
    selector: 'app-transmission-chain-filters',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './transmission-chains-filters.component.html',
    styleUrls: ['./transmission-chains-filters.component.less']
})
export class TransmissionChainsFiltersComponent {
    @Input() title: string;
    @Input() filters: TransmissionChainFilters = new TransmissionChainFilters();
    @Input() caseClassificationsList$: Observable<LabelValuePair[]>;
    @Input() occupationsList$: Observable<LabelValuePair[]>;
    @Input() outcomeList$: Observable<LabelValuePair[]>;
    @Input() genderList$: Observable<LabelValuePair[]>;

    @HostBinding('class.form-element-host') isFormElement = true;
}


