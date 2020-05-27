import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material';
import { SnackbarHelperService } from '../../../core/services/helper/snackbar-helper.service';
import * as _ from 'lodash';

@Component({
    selector: 'app-multiple-snackbar',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './multiple-snackbar.component.html',
    styleUrls: ['./multiple-snackbar.component.less']
})
export class MultipleSnackbarComponent implements OnInit {

    errors: {message: string, messageClass: string}[] = [];

    // available themes: 'success', 'error'
    theme: string;
    message: string;
    html: boolean;
    snackClass: string;

    constructor(
        @Inject(MAT_SNACK_BAR_DATA) public data: any[],
        public snackBarRef: MatSnackBarRef<MultipleSnackbarComponent>,
        public snackbarHelperService: SnackbarHelperService
    ) {
        this.theme = _.get(data, 'theme');
        this.message = _.get(data, 'message');
        this.html = _.get(data, 'html');
    }

    ngOnInit() {
        // reset errors
        this.errors = [];
        console.log('data', this.data);
        // console.log(this.errors);
        this.snackBarRef.afterOpened().subscribe(() => {
            this.snackbarHelperService.errorSubject.subscribe((message) => {
                console.log(message);
                this.errors.push(message);
                // console.log(this.errors);
            });
        });
        this.snackBarRef.afterDismissed().subscribe(() => {
            // console.log(`after dismiss function`);
            this.snackbarHelperService.snackbarsOpenedSubject.next(false);
        });
    }

    closeSnackbar(item, ind) {
        if (this.errors.length === 1) {
            this.closeAllSnackbars();
        } else {
            this.errors = this.errors.filter((err, index) => {
                return index !== ind ? err : '';
            });
            // console.log(this.errors);
        }
    }

    closeAllSnackbars() {
        console.log(`close function`);
        this.errors = [];
        this.snackBarRef.dismiss();
    }

}
