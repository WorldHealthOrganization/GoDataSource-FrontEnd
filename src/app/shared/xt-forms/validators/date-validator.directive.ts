import { Directive, forwardRef, Input } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS, ControlContainer, NgForm, NgModelGroup } from '@angular/forms';
import * as _ from 'lodash';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { AppFormBaseV2 } from '../../forms-v2/core/app-form-base-v2';
import { LocalizationHelper, Moment, MomentBuiltinFormat } from '../../../core/helperClasses/localization-helper';

/**
 * Handle Date compare input
 */
export class DateValidatorFieldComparator {
  constructor(
    public compareItemValue: string | Moment | AppFormBaseV2<any>,
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
  @Input() displayFormat: string = LocalizationHelper.getDateDisplayFormat();
  @Input() allowedDateFormats: (string | MomentBuiltinFormat)[] = [
    LocalizationHelper.getDateDisplayFormat(),
    LocalizationHelper.ISO_8601
  ];

  // date must be bigger than
  @Input() dateAfter: any;
  @Input() dateSameOrAfter: any;
  @Input() dateSame: any;
  @Input() dateBefore: any;
  @Input() dateSameOrBefore: any;

  /**
   * Constructor
   */
  constructor(
    private i18nService: I18nService,
    private controlContainer: ControlContainer
  ) {
  }

  /**
   * Compare control date with provided dates
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
          compare instanceof AppFormBaseV2 ||
          LocalizationHelper.isInstanceOfMoment(compare) ||
          _.isString(compare)
        ) {
          compareItem = new DateValidatorFieldComparator(
            compare as string | AppFormBaseV2<any> | Moment
          );
        } else {
          compareItem = compare as DateValidatorFieldComparator;
        }

        // if compare is empty, then we can't validate
        if (_.isEmpty(compareItem)) {
          return;
        }

        // retrieve date from brother control
        // & label if necessary
        let compareWithDate: Moment;
        let fieldLabel = compareItem.fieldLabel;
        if (LocalizationHelper.isInstanceOfMoment(compareItem.compareItemValue)) {
          compareWithDate = compareItem.compareItemValue as Moment;
        }

        // check if we have a name or a string date
        if (_.isString(compareItem.compareItemValue)) {
          // form control
          if (
            this.controlContainer &&
            this.controlContainer instanceof NgForm &&
            this.controlContainer.controls[compareItem.compareItemValue as string] &&
            (this.controlContainer.controls[compareItem.compareItemValue as string] as any)._gd_component
          ) {
            compareItem = new DateValidatorFieldComparator(
              (this.controlContainer.controls[compareItem.compareItemValue as string] as any)._gd_component,
              fieldLabel
            );
          } else if (
            this.controlContainer &&
            (this.controlContainer instanceof NgModelGroup) &&
            this.controlContainer.control &&
            this.controlContainer.control.controls[compareItem.compareItemValue as string] &&
            (this.controlContainer.control.controls[compareItem.compareItemValue as string] as any)._gd_component
          ) {
            compareItem = new DateValidatorFieldComparator(
              (this.controlContainer.control.controls[compareItem.compareItemValue as string] as any)._gd_component,
              fieldLabel
            );
          } else if (
            this.controlContainer &&
            (this.controlContainer instanceof NgModelGroup) &&
            this.controlContainer.formDirective instanceof NgForm &&
            this.controlContainer.formDirective.controls[compareItem.compareItemValue as string] &&
            (this.controlContainer.formDirective.controls[compareItem.compareItemValue as string] as any)._gd_component
          ) {
            compareItem = new DateValidatorFieldComparator(
              (this.controlContainer.formDirective.controls[compareItem.compareItemValue as string] as any)._gd_component,
              fieldLabel
            );
          } else {
            // value from string
            compareWithDate = LocalizationHelper.toMoment(compareItem.compareItemValue as string);
          }
        }

        // check for element
        let element: AppFormBaseV2<any> = null;
        if (compareItem.compareItemValue instanceof AppFormBaseV2) {
          // retrieve component form control
          element = compareItem.compareItemValue as AppFormBaseV2<any>;

          // value
          compareWithDate = element.value ? LocalizationHelper.toMoment(element.value) : null;

          // label
          if (!fieldLabel) {
            fieldLabel = (element as any).placeholder;
            fieldLabel = fieldLabel ? this.i18nService.instant(fieldLabel) : fieldLabel;
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
          (function(localElement: AppFormBaseV2<any>) {
            setTimeout(() => {
              // trigger validation
              localElement.control.updateValueAndValidity();
              if ((localElement as any).onChange) {
                (localElement as any).onChange((localElement as any).value);
              }
            }, 50);
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
   */
  validate(control: AbstractControl): { [key: string]: any } {
    // no point in validating empty values, this is handled by required validator
    if (_.isEmpty(control.value)) {
      return null;
    }

    // validate date
    let value: any = control.value;
    if (LocalizationHelper .isInstanceOfMoment(control.value)) {
      value = _.isObject(value._i) ? value : value._i;
    }

    // check if we have a valid date
    let controlDate: Moment;
    let invalid: {} | null = {
      invalidDateValidator: true
    };
    this.allowedDateFormats.forEach((format) => {
      controlDate = LocalizationHelper.toMoment(value, format, true);
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
