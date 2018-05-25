import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { FormControl, NgForm } from '@angular/forms';

import * as _ from 'lodash';

@Injectable()
export class FormHelperService {

    /**
     * Extract the "dirty" fields of a Form
     * @param {NgForm} form
     * @returns {any}
     */
    getDirtyFields(form: NgForm) {
        const dirtyFields = {};

        _.forEach(form.controls, (control: FormControl, controlName: string) => {
            if (control.dirty) {
                dirtyFields[controlName] = control.value;
            }
        });

        return dirtyFields;
    }
}

