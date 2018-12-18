import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { AbstractControl, FormControl, NgForm } from '@angular/forms';
import * as _ from 'lodash';
import { SnackbarService } from './snackbar.service';
import { I18nService } from './i18n.service';

@Injectable()
export class FormHelperService {

    constructor(
        private snackbarService: SnackbarService,
        private i18nService: I18nService
    ) {}

    /**
     * Retrieve control value
     * @param control
     */
    getControlValue(control: FormControl): any {
        return (control as any).getFilteredValue ?
            (control as any).getFilteredValue() :
            control.value;
    }

    /**
     * Get all fields of a form, with their values
     * @param {NgForm} form
     * @returns {any}
     */
    getFields(form: NgForm): any {
        const fields = {};

        _.forEach(form.controls, (control: FormControl, controlName: string) => {
            _.set(
                fields,
                controlName,
                this.getControlValue(control)
            );
        });

        return fields;
    }

    /**
     * Extract the "dirty" fields of a Form
     * @param {NgForm} form
     * @returns {any}
     */
    getDirtyFields(form: NgForm) {
        const dirtyFields = {};

        _.forEach(form.controls, (control: FormControl, controlName: string) => {
            if (control.dirty) {
                if ((control as any).getDirtyFields) {
                    _.each((control as any).getDirtyFields(), (
                        childControl: FormControl,
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

        return dirtyFields;
    }

    /**
     * Extract the "dirty" fields from a set of Forms, merging all of them into a single object
     * @param {NgForm[]} forms
     */
    mergeDirtyFields(forms: NgForm[]) {
        let dirtyFields = {};

        _.forEach(forms, (form: NgForm) => {
            // get the dirty fields of each form
            dirtyFields = {...dirtyFields, ...this.getDirtyFields(form)};
        });

        return dirtyFields;
    }

    /**
     * Merge all the fields from a set of Forms into a single object
     * @param {NgForm[]} forms
     * @returns {any}
     */
    mergeFields(forms: NgForm[]) {
        let fields = {};

        _.forEach(forms, (form: NgForm) => {
            // get the fields of each form
            const formFields = this.getFields(form);

            fields = {...fields, ...formFields};
        });

        return fields;
    }

    /**
     * Check a set of forms and verify if they are all valid
     * @param {NgForm[]} forms
     * @returns {boolean}
     */
    isFormsSetValid(forms: NgForm[]) {
        let isValid = true;

        _.forEach(forms, (form: NgForm) => {
            isValid = isValid && form.valid;
        });

        return isValid;
    }

    /**
     * Check if a form is modified and valid, otherwise display a meaningful error
     * @param form
     * @param checkForChanges
     * @returns {boolean}
     */
    validateForm(
        form: NgForm,
        checkForChanges: boolean = true
    ) {
        // display invalid error if form is invalid
        if (!form.valid) {
            // determine fields that are invalid
            let fields: string = '';
            _.each(form.controls, (ctrl: FormControl, name: string) => {
                // invalid controls
                if (
                    ctrl.invalid &&
                    !_.isEmpty(name)
                ) {
                    // determine directive
                    const directive = _.find((form as any)._directives, { name: name });
                    if (
                        directive &&
                        directive.valueAccessor &&
                        directive.valueAccessor.placeholder
                    ) {
                        // most of the time this is already translated, but we need to make sure
                        fields += (_.isEmpty(fields) ? '' : ', ') +
                            this.i18nService.instant(directive.valueAccessor.placeholder);
                    }
                }
            });

            // display error message
            this.snackbarService.showError(
                _.isEmpty(fields) ? 'LNG_FORM_ERROR_FORM_INVALID' : 'LNG_FORM_ERROR_FORM_INVALID_WITH_FIELDS', {
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
                this.snackbarService.showSuccess('LNG_FORM_WARNING_NO_CHANGES');
                return false;
            }
        }

        // form is valid
        return true;
    }

    /**
     * Get list of invalid controls
     * @param form
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

