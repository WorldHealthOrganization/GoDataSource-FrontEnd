import { Injectable } from '@angular/core';
import { AbstractControl, UntypedFormControl, NgForm } from '@angular/forms';
import * as _ from 'lodash';
import { I18nService } from './i18n.service';
import { ToastV2Service } from './toast-v2.service';

@Injectable()
export class FormHelperService {
  // if field name starts with this then we won't retrieve value from it, just like not being touched
  static readonly IGNORE_FIELD_PREFIX = '__';

  /**
   * Constructor
   */
  constructor(
    private toastV2Service: ToastV2Service,
    private i18nService: I18nService
  ) {}

  /**
   * Retrieve control value
   */
  getControlValue(control: UntypedFormControl): any {
    return (control as any).getFilteredValue ?
      (control as any).getFilteredValue() :
      control.value;
  }

  /**
   * Get all fields of a form, with their values
   */
  getFields(form: NgForm): any {
    // fields
    const fields = {};

    // retrieve fields
    _.forEach(form.controls, (control: UntypedFormControl, controlName: string) => {
      // ignore field ?
      if (controlName.startsWith(FormHelperService.IGNORE_FIELD_PREFIX)) {
        return;
      }

      // set data
      _.set(
        fields,
        controlName,
        this.getControlValue(control)
      );
    });

    // finished
    return fields;
  }

  /**
   * Extract the "dirty" fields of a Form
   */
  getDirtyFields(form: NgForm) {
    // fields
    const dirtyFields = {};

    // retrieve fields
    _.forEach(form.controls, (control: UntypedFormControl, controlName: string) => {
      // ignore field ?
      if (controlName.startsWith(FormHelperService.IGNORE_FIELD_PREFIX)) {
        return;
      }

      // set data
      if (control.dirty) {
        if ((control as any).getDirtyFields) {
          _.each((control as any).getDirtyFields(), (
            childControl: UntypedFormControl,
            childControlName: string
          ) => {
            _.set(dirtyFields, childControlName, childControl.value);
          });
        } else {
          _.set(
            dirtyFields,
            controlName,
            this.getControlValue(control)
          );
        }
      }
    });

    // finished
    return dirtyFields;
  }

  /**
   * Extract the "dirty" fields from a set of Forms, merging all of them into a single object
   */
  mergeDirtyFields(forms: NgForm[]) {
    // fields
    let dirtyFields = {};

    // retrieve fields
    _.forEach(forms, (form: NgForm) => {
      // get the dirty fields of each form
      dirtyFields = { ...dirtyFields, ...this.getDirtyFields(form) };
    });

    // finished
    return dirtyFields;
  }

  /**
   * Merge all the fields from a set of Forms into a single object
   */
  mergeFields(forms: NgForm[]) {
    // fields
    let fields = {};

    // retrieve fields
    _.forEach(forms, (form: NgForm) => {
      // get the fields of each form
      fields = { ...fields, ...this.getFields(form) };
    });

    // finished
    return fields;
  }

  /**
   * Check a set of forms and verify if they are all valid
   */
  isFormsSetValid(forms: NgForm[]) {
    // if one form is invalid..then...
    forms = forms || [];
    for (const form of forms) {
      if (!form.valid) {
        return false;
      }
    }

    // finished
    return true;
  }

  /**
   * Check if a form is modified and valid, otherwise display a meaningful error
   */
  validateForm(
    form: NgForm,
    checkForChanges: boolean = true
  ) {
    // display invalid error if form is invalid
    if (!form.valid) {
      // determine fields that are invalid
      let fields: string = '';
      const checkControlsForInvalidStatus = (
        controlsForm: NgForm,
        prefixes: string[] = []
      ) => {
        // check controls validity
        let lastControlRowIndexes: number[];
        const mustCheckForms: {
          controlsForm: NgForm,
          prefixes: string[]
        }[] = [];
        _.each(controlsForm.controls, (ctrl: AbstractControl, name: string) => {
          // invalid controls
          if (
            ctrl.invalid &&
            !_.isEmpty(name)
          ) {
            // determine directive
            let directives = (controlsForm as any)._directives;
            directives = directives ? Array.from(directives) : directives;
            const directive = _.find(directives, { name: name }) as any;
            if (
              directive &&
              directive.valueAccessor
            ) {
              // determine row indexes
              const nameWithIndexes: string = directive.valueAccessor.alternativeName ? directive.valueAccessor.alternativeName : name;
              const rowIndexes = _.chain(nameWithIndexes.match(/\[\d+\]/g))
                .map((v: string) => v.replace(/\[|\]/g, ''))
                .map((v: string) => _.parseInt(v) + 1)
                .value();

              // do we have placeholder ?
              if (directive.valueAccessor.placeholder) {
                // same row as previous one, if not we need to display data on a new row ?
                let firstField: boolean = false;
                if (!_.isEqual(rowIndexes, lastControlRowIndexes)) {
                  // add new error row
                  fields += '<br />- ';

                  // reset first field label for this row
                  firstField = true;

                  // add prefixes
                  let addedItemNo: boolean = false;
                  _.each(rowIndexes, (rowIndex: number, index: number) => {
                    // do we have a prefix for this item ?
                    let prefix: string = '';
                    if (!_.isEmpty(prefixes[index])) {
                      prefix = ` ${prefixes[index]}`;
                    }

                    // add prefix
                    fields += prefix + ' ' + this.i18nService.instant(
                      'LNG_FORM_ERROR_FORM_INVALID_WITH_FIELDS_ROW', {
                        item: rowIndex
                      }
                    );

                    // now we have item numbers
                    addedItemNo = true;
                  });

                  // do we need to add : after item numbers ?
                  if (addedItemNo) {
                    fields += ': ';
                  }
                }

                // determine field label
                const fieldLabel: string = this.i18nService.instant(directive.valueAccessor.placeholder);

                // add field label to list of errors
                fields += firstField ? fieldLabel : `, ${fieldLabel}`;

                // set the new rows
                lastControlRowIndexes = rowIndexes;
              } else if (
                directive.valueAccessor.groupForm &&
                directive.valueAccessor.groupForm.controls
              ) {
                // merge old & new prefixes
                const newPrefixes: string[] = _.clone(prefixes);
                if (directive.valueAccessor.componentTitle) {
                  newPrefixes.push(this.i18nService.instant(directive.valueAccessor.componentTitle));
                }

                // determine child fields that are invalid
                // using mustCheckForms to keep input order, otherwise addresses error messages will appear before firstname errors..
                mustCheckForms.push({
                  controlsForm: directive.valueAccessor.groupForm,
                  prefixes: newPrefixes
                });
              }
            }
          }
        });

        // validate remaining form children
        _.each(mustCheckForms, (data: {
          controlsForm: NgForm,
          prefixes: string[]
        }) => {
          checkControlsForInvalidStatus(
            data.controlsForm,
            data.prefixes
          );
        });
      };

      // determine form invalid fields
      checkControlsForInvalidStatus(form);

      // display error message
      this.toastV2Service.error(
        _.isEmpty(fields) ? 'LNG_FORM_ERROR_FORM_INVALID' : 'LNG_FORM_ERROR_FORM_INVALID_WITH_FIELDS',
        {
          fields: fields
        }
      );

      // finished
      return false;
    }

    // should we to display a message if there are no changes ?
    if (checkForChanges) {
      // get dirty fields
      const dirtyFields: any = this.getDirtyFields(form);

      // if there are no changes, display an error
      if (_.isEmpty(dirtyFields)) {
        this.toastV2Service.success('LNG_FORM_WARNING_NO_CHANGES');
        return false;
      }
    }

    // form is valid
    return true;
  }

  /**
   * Get list of invalid controls
   */
  getInvalidControls(form: NgForm) {
    // we don't handle if there are two controls with the same name
    const invalidControls: {
      [name: string]: AbstractControl
    } = {};
    _.forEach(form.controls, (control: AbstractControl, controlName: string) => {
      if (control.invalid) {
        invalidControls[controlName] = control;
      }
    });

    // finished
    return invalidControls;
  }
}

