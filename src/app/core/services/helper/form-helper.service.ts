import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { AbstractControl, FormControl, NgForm } from '@angular/forms';
import * as _ from 'lodash';
import { SnackbarService } from './snackbar.service';

@Injectable()
export class FormHelperService {

    constructor(
        private snackbarService: SnackbarService
    ) {}

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
                (control as any).getFilteredValue ?
                    (control as any).getFilteredValue() :
                    control.value
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
                        (control as any).getFilteredValue ?
                            (control as any).getFilteredValue() :
                            control.value
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
            this.snackbarService.showError('LNG_FORM_ERROR_FORM_INVALID');
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

