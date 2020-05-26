import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material';
import { SnackbarHelperService } from '../../../core/services/helper/snackbar-helper.service';

@Component({
    selector: 'app-multiple-snackbar',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './multiple-snackbar.component.html',
    styleUrls: ['./multiple-snackbar.component.less']
})
export class MultipleSnackbarComponent implements OnInit {

    errors: any[] = [];

    constructor(
        @Inject(MAT_SNACK_BAR_DATA) public data: any[],
        public snackBarRef: MatSnackBarRef<MultipleSnackbarComponent>,
        public snackbarHelperService: SnackbarHelperService
    ) {

    }

    ngOnInit() {
        this.errors = [];
        console.log(this.errors);
        this.snackBarRef.afterOpened().subscribe(() => {
            this.snackbarHelperService.errorSubject.subscribe((message) => {
                this.errors.push(message);
                console.log(this.errors);
            });
        });
        this.snackBarRef.afterDismissed().subscribe(() => {
            console.log(`after dismiss function`);
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
            console.log(this.errors);
        }
    }

    closeAllSnackbars() {
        console.log(`close function`);
        this.errors = [];
        this.snackBarRef.dismiss();
    }

}
