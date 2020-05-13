import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material';

@Component({
    selector: 'app-multiple-snackbar',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './multiple-snackbar.component.html',
    styleUrls: ['./multiple-snackbar.component.less']
})
export class MultipleSnackbarComponent implements OnInit {

    constructor(
        @Inject(MAT_SNACK_BAR_DATA) public data: any
    ) {
    }

    ngOnInit() {
    }

    closeSnackbar() {

    }

}
