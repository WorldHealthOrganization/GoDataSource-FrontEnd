import { GroupBase } from '../../xt-forms/core/group-base';
import { Component, Host, Inject, Input, OnInit, Optional, SkipSelf, ViewEncapsulation } from '@angular/core';
import { ControlContainer, NG_ASYNC_VALIDATORS, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';

import * as _ from 'lodash';

const enum FormRangeModelOperator {
    BETWEEN = 'between',
    GREATER = 'gt',
    GREATER_OR_EQUAL = 'gte',
    LESS = 'lt',
    LESS_OR_EQUAL = 'lte'
}

export const enum FormRangeModelComparator {
    LESS = '<',
    LESS_OR_EQUAL = '<='
}

export class FormRangeModel {
    comparator: FormRangeModelComparator = FormRangeModelComparator.LESS_OR_EQUAL;
    from: number;
    to: number;

    constructor(data = null) {
        this.from = _.get(data, 'from');
        this.to = _.get(data, 'to');
    }

    /**
     * Check if we have anything in any of the 2 fields
     * @returns {boolean}
     */
    public get isEmpty(): boolean {
        return _.isEmpty(this.from) && _.isEmpty(this.to);
    }

    /**
     * Retrieve operator
     * @returns {FormRangeModelOperator}
     */
    public get operator(): FormRangeModelOperator {
        return this.isEmpty ? null : (
            !_.isEmpty(this.from) && !_.isEmpty(this.to) ?
                FormRangeModelOperator.BETWEEN : (
                    _.isEmpty(this.to) ?
                        (this.comparator === FormRangeModelComparator.LESS ? FormRangeModelOperator.GREATER : FormRangeModelOperator.GREATER_OR_EQUAL) :
                        (this.comparator === FormRangeModelComparator.LESS ? FormRangeModelOperator.LESS : FormRangeModelOperator.LESS_OR_EQUAL)
                )
        );
    }

    /**
     * Value used to compare
     */
    public get value() {
        return this.isEmpty ? null : (
            !_.isEmpty(this.from) && !_.isEmpty(this.to) ?
                [this.from, this.to] : (
                    _.isEmpty(this.to) ?
                        this.from :
                        this.to
                )
        );
    }
}

export const enum FormRangeType {
    NUMBER = 'number',
    INTEGER = 'integer'
}

@Component({
    selector: 'app-form-range',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-range.component.html',
    styleUrls: ['./form-range.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormRangeComponent,
        multi: true
    }]
})
export class FormRangeComponent extends GroupBase<FormRangeModel> implements OnInit {
    @Input() type: FormRangeType = FormRangeType.NUMBER;
    @Input() comparer: FormRangeModelComparator = FormRangeModelComparator.LESS_OR_EQUAL;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    /**
     * Initialize component elements
     */
    ngOnInit() {
        // init value
        if (this.value) {
            this.value = this.value instanceof FormRangeModel ? this.value : new FormRangeModel(this.value);
        } else {
            this.value = new FormRangeModel();
        }

        // we need to remove empty values
        this.valueMapInternal = value => {
            return _.isEmpty(value) || _.isEmpty(value.operator) ? null : this.value;
        };
    }

    /**
     * True if our input should accept decimals
     */
    get isNumber(): boolean {
        return this.type.toLowerCase() === FormRangeType.NUMBER.toLowerCase();
    }

    /**
     * Model
     */
    get range(): FormRangeModel {
        // finished
        return this.value ? this.value : new FormRangeModel();
    }

    onChange() {
        // set comparator
        this.value.comparator = this.comparer;

        // emit event
        super.onChange();
    }
}
