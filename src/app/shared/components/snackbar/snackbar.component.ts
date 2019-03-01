import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material';

import * as _ from 'lodash';

@Component({
    selector: 'app-snackbar',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './snackbar.component.html',
    styleUrls: ['./snackbar.component.less']
})
export class SnackbarComponent {

    // available themes: 'success', 'error'
    theme: string;
    message: string;
    html: boolean;

    constructor(
        @Inject(MAT_SNACK_BAR_DATA) public data: any
    ) {
        this.theme = _.get(data, 'theme');
        this.message = _.get(data, 'message');
        this.html = _.get(data, 'html');
    }

}
