import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { FormControl, NgForm } from '@angular/forms';

import * as _ from 'lodash';

@Injectable()
export class FormHelperService {

    /**
     * Get all fields of a form, with their values
     * @param {NgForm} form
     * @returns {{}}
     */
    getFields(form: NgForm) {
        const fields = {};

        _.forEach(form.controls, (control: FormControl, controlName: string) => {
            _.set(fields, controlName, control.value);
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
                _.set(dirtyFields, controlName, control.value);
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
}

