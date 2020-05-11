import { Component, Inject, OnInit } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material';

@Component({
    selector: 'app-multiple-snackbar',
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
