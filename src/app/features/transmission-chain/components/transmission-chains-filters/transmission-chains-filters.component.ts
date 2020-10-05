import { Component, HostBinding, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { AgeModel } from '../../../../core/models/age.model';
import { Observable } from 'rxjs';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import * as _ from 'lodash';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { Moment } from '../../../../core/helperClasses/x-moment';
import { map, share } from 'rxjs/operators';
import { Constants } from '../../../../core/models/constants';

export class TransmissionChainFilters {
    classificationId: string[];
    occupation: string[];
    outcomeId: string[];
    firstName: string;
    lastName: string;
    gender: string;
    locationIds: string[];
    age: AgeModel;
    date: Moment;
    includeContactsOfContacts: boolean;

    showContacts?: boolean;
    showEvents?: boolean;

    /**
     * Constructor
     * @param data
     */
    constructor(data: {
        classificationId?: string[],
        occupation?: string[],
        outcomeId?: string[],
        firstName?: string,
        lastName?: string,
        gender?: string,
        locationIds?: string[],
        age?: AgeModel,
        date?: Moment,
        includeContactsOfContacts?: boolean
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
        if (!_.isEmpty(this.classificationId)) {
            qb.filter.where({
                or: [
                    {
                        type: {
                            neq: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE'
                        }
                    }, {
                        type: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE',
                        classification: {
                            inq: this.classificationId
                        }
                    }
                ]
            });
        }

        // occupation
        if (!_.isEmpty(this.occupation)) {
            qb.filter.where({
                and: [{
                    occupation: {
                        inq: this.occupation
                    }
                }]
            });
        }

        // outcome
        if (!_.isEmpty(this.outcomeId)) {
            qb.filter.where({
                and: [{
                    outcomeId: {
                        inq: this.outcomeId
                    }
                }]
            });
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

        // location
        if (!_.isEmpty(this.locationIds)) {
            qb.filter.where({
                or: [
                    {
                        type: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_EVENT',
                        'address.parentLocationIdFilter': {
                            inq: this.locationIds
                        }
                    }, {
                        type: {
                            inq: !this.includeContactsOfContacts ?
                                [
                                    'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE',
                                    'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CONTACT'
                                ] :
                                [
                                    'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE',
                                    'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CONTACT',
                                    'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CONTACT_OF_CONTACT'
                                ]
                        },
                        'addresses.parentLocationIdFilter': {
                            inq: this.locationIds
                        }
                    }
                ]
            });
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
export class TransmissionChainsFiltersComponent implements OnInit {
    @Input() titleName: string;
    @Input() filters: TransmissionChainFilters = new TransmissionChainFilters();

    @HostBinding('class.form-element-host') isFormElement = true;

    caseClassificationsList$: Observable<LabelValuePair[]>;
    occupationsList$: Observable<LabelValuePair[]>;
    outcomeList$: Observable<LabelValuePair[]>;
    genderList$: Observable<LabelValuePair[]>;

    constructor(
        private referenceDataDataService: ReferenceDataDataService
    ) {}

    ngOnInit(): void {
        this.caseClassificationsList$ = this.referenceDataDataService
            .getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION)
            .pipe(
                map((records: LabelValuePair[]) => {
                    return _.filter(
                        records,
                        (record: LabelValuePair) => {
                            return record.value !== Constants.CASE_CLASSIFICATION.NOT_A_CASE;
                        }
                    );
                }),
                share()
            );
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);
        this.outcomeList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OUTCOME);
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
    }

}


