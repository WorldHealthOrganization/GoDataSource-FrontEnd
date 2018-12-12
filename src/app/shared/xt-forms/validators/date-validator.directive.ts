import { Directive, forwardRef, Input } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS, ControlContainer, NgForm, NgModel } from '@angular/forms';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Moment, MomentBuiltinFormat } from 'moment';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { ElementBase } from '../core';
import { Constants } from '../../../core/models/constants';

/**
 * Handle Date compare input
 */
export class DateValidatorFieldComparator {
    constructor(
        public compareItemValue: string | Moment | ElementBase<any>,
        public fieldLabel: string = null
    ) {}
}

/**
 * Custom date validator
 * Use modes:
 * dateSameOrBefore="'controlName'" where control with controlName value is a date and it has a placeholder which will be used as label
 * * dateSameOrBefore="['controlName']" where control with controlName value is a date and it has a placeholder which will be used as label
 * dateSameOrBefore="['controlName1', 'controlName2']" where control with controlName value is a date and it has a placeholder which will be used as label
 * dateSameOrBefore="[['controlName1'], 'controlName2']" where control with controlName value is a date and it has a placeholder which will be used as label
 * dateSameOrBefore="[['controlName1', 'test'], 'controlName2']" where control with controlName value is a date and test will be used as fieldLabel for control 1,
 *      and placeholder for control 2
 * dateSameOrBefore="{compareItemValue: 'controlName1'}" equivalent to 'controlName'
 * dateSameOrBefore="{compareItemValue: 'controlName1', fieldLabel: 'test'}" equivalent to ['controlName', 'test']
 * dateSameOrBefore="[{compareItemValue: 'controlName1', fieldLabel: 'test'}, {compareItemValue: 'controlName2'}]" equivalent to [['controlName', 'test'], 'controlName2']
 * dateSameOrBefore="'string date'"
 * dateSameOrBefore="['string date1', 'string date2']"
 * dateSameOrBefore="momentObject"
 * dateSameOrBefore="[momentObject1, momentObject2]"
 * dateSameOrBefore="elementBaseItem" equivalent to 'controlName', but in this case we give the control object instead of the name
 * dateSameOrBefore="[elementBaseItem]" equivalent to ['controlName'], but in this case we give the control object instead of the name
 * dateSameOrBefore="[elementBaseItem1, elementBaseItem2]" equivalent ['controlName1', 'controlName2'], but in this case we give the control objects instead of the names
 * dateSameOrBefore="[[elementBaseItem1, 'label']]"
 */
@Directive({
    selector: '[app-date-validator][ngModel]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => DateValidatorDirective),
            multi: true
        }
    ]
})
export class DateValidatorDirective implements Validator {
    // allowed formats
    @Input() displayFormat: string = Constants.DEFAULT_DATE_DISPLAY_FORMAT;
    @Input() allowedDateFormats: (string | MomentBuiltinFormat)[] = [
        Constants.DEFAULT_DATE_DISPLAY_FORMAT,
        moment.ISO_8601
    ];

    // date must be bigger than
    @Input() dateAfter: DateValidatorFieldComparator | DateValidatorFieldComparator[];
    @Input() dateSameOrAfter: DateValidatorFieldComparator | DateValidatorFieldComparator[];
    @Input() dateSame: DateValidatorFieldComparator | DateValidatorFieldComparator[];
    @Input() dateBefore: DateValidatorFieldComparator | DateValidatorFieldComparator[];
    @Input() dateSameOrBefore: DateValidatorFieldComparator | DateValidatorFieldComparator[];

    /**
     * Constructor
     * @param i18nService
     */
    constructor(
        private i18nService: I18nService,
        private controlContainer: ControlContainer
    ) {}

    /**
     * Compare control date with provided dates
     * @param propertyArray
     * @param controlDate
     * @param method
     * @param methodLabel
     */
    private compareDate(
        propertyArray: DateValidatorFieldComparator | DateValidatorFieldComparator[],
        controlDate: Moment,
        method: string,
        methodLabel: string
    ): {} | null {
        // go through items and check if our condition passes
        let invalid: {} | null = null;
        _.each(
            _.isArray(propertyArray) ?
                propertyArray as any[] :
                [propertyArray],
            (compare: any[] | DateValidatorFieldComparator | string) => {
                // convert array to object
                let compareItem: DateValidatorFieldComparator;
                if (_.isArray(compare)) {
                    compareItem = new DateValidatorFieldComparator(
                        compare[0],
                        (compare as any[]).length > 1 ? compare[1] : null
                    );
                } else if (
                    compare instanceof ElementBase ||
                    compare instanceof moment ||
                    _.isString(compare)
                ) {
                    compareItem = new DateValidatorFieldComparator(
                        compare as string | ElementBase<any> | Moment
                    );
                } else {
                    compareItem = compare as DateValidatorFieldComparator;
                }

                // retrieve date from brother control
                // & label if necessary
                let compareWithDate: Moment;
                let fieldLabel = compareItem.fieldLabel;
                if (compareItem.compareItemValue instanceof moment) {
                    compareWithDate = compareItem.compareItemValue as Moment;
                }

                // check if we have a name or a string date
                if (_.isString(compareItem.compareItemValue)) {
                    // form control
                    if (
                        this.controlContainer &&
                        this.controlContainer instanceof NgForm &&
                        this.controlContainer.controls[compareItem.compareItemValue as string]
                    ) {
                        compareItem = new DateValidatorFieldComparator(
                            (_.find(
                                (this.controlContainer as any)._directives, {
                                    name: compareItem.compareItemValue as string
                                }
                            ) as NgModel).valueAccessor as ElementBase<any>,
                            fieldLabel
                        );
                    } else {
                        // value from string
                        (moment as any).suppressDeprecationWarnings = true;
                        compareWithDate = moment(compareItem.compareItemValue as string);
                        (moment as any).suppressDeprecationWarnings = false;
                    }
                }

                // check for element
                let element: ElementBase<any> = null;
                if (compareItem.compareItemValue instanceof ElementBase) {
                    // retrieve component form control
                    element = compareItem.compareItemValue as ElementBase<any>;

                    // value
                    compareWithDate = element.value ? moment(element.value) : null;

                    // label
                    if (!fieldLabel) {
                        fieldLabel = (element as any).placeholder;
                    }
                }

                // don't check empty values
                compareWithDate = compareWithDate && compareWithDate.isValid() ? compareWithDate : null;
                if (!compareWithDate) {
                    return true;
                }

                // validate date
                if (!controlDate.startOf('day')[method](compareWithDate.startOf('day'))) {
                    invalid = {
                        dateValidator: {
                            field: fieldLabel ? fieldLabel : compareWithDate.format(this.displayFormat),
                            comparator: this.i18nService.instant(methodLabel),
                            compareDate: compareWithDate.format(this.displayFormat),
                            currentDate: controlDate.format(this.displayFormat)
                        }
                    };
                }

                // do we need to validate counterpart as well ?
                if (
                    element &&
                    element.invalid !== (invalid ? true : false)
                ) {
                    (function(localElement: ElementBase<any>) {
                        setTimeout(() => {
                            // trigger validation
                            localElement.control.updateValueAndValidity();
                            if ((localElement as any).onChange) {
                                (localElement as any).onChange();
                            }
                        }, 500);
                    })(element);
                }

                // stop "for" since element is invalid
                if (invalid) {
                    return false;
                }
            }
        );

        // finished
        return invalid;
    }

    /**
     * Validate
     * @param control
     */
    validate(control: AbstractControl): { [key: string]: any } {
        // no point in validating empty values, this is handled by required validator
        if (_.isEmpty(control.value)) {
            return null;
        }

        // validate date
        const value: string = control.value instanceof moment ?
            ( _.isObject(control.value._i) ? control.value : control.value._i ) :
            control.value;

        // check if we have a valid date
        let controlDate: Moment;
        let invalid: {} | null = {
            invalidDateValidator: true
        };
        this.allowedDateFormats.forEach((format) => {
            controlDate = moment(value, format, true);
            if (controlDate.isValid()) {
                // at least one format is valid
                invalid = null;

                // stop "for"
                return false;
            }
        });

        // check if our date must be bigger than other dates
        if (controlDate) {
            // after
            if (
                !invalid &&
                this.dateAfter
            ) {
                invalid = this.compareDate(
                    this.dateAfter,
                    controlDate,
                    'isAfter',
                    'LNG_FORM_VALIDATION_ERROR_DATE_COMPARE_AFTER'
                );
            }

            // same or after
            if (
                !invalid &&
                this.dateSameOrAfter
            ) {
                invalid = this.compareDate(
                    this.dateSameOrAfter,
                    controlDate,
                    'isSameOrAfter',
                    'LNG_FORM_VALIDATION_ERROR_DATE_COMPARE_SAME_OR_AFTER'
                );
            }

            // same
            if (
                !invalid &&
                this.dateSame
            ) {
                invalid = this.compareDate(
                    this.dateSame,
                    controlDate,
                    'isSame',
                    'LNG_FORM_VALIDATION_ERROR_DATE_COMPARE_SAME'
                );
            }

            // before
            if (
                !invalid &&
                this.dateBefore
            ) {
                invalid = this.compareDate(
                    this.dateBefore,
                    controlDate,
                    'isBefore',
                    'LNG_FORM_VALIDATION_ERROR_DATE_COMPARE_BEFORE'
                );
            }

            // same or before
            if (
                !invalid &&
                this.dateSameOrBefore
            ) {
                invalid = this.compareDate(
                    this.dateSameOrBefore,
                    controlDate,
                    'isSameOrBefore',
                    'LNG_FORM_VALIDATION_ERROR_DATE_COMPARE_SAME_OR_BEFORE'
                );
            }
        }

        // valid
        return invalid;
    }
}
