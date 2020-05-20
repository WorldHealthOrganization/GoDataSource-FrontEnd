import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material';

@Component({
    selector: 'app-multiple-snackbar',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './multiple-snackbar.component.html',
    styleUrls: ['./multiple-snackbar.component.less']
})
export class MultipleSnackbarComponent implements OnInit {

    constructor(
        @Inject(MAT_SNACK_BAR_DATA) public data: any[],
        public snackBarRef: MatSnackBarRef<MultipleSnackbarComponent>
    ) {
    }

    ngOnInit() {
    }

    closeSnackbar(item, ind) {
        console.log('errors' , this.data);
        console.log('lenght' , this.data.length);
        console.log('item' , item);
        console.log('index' , ind);
        // console.log( ,this.data);
        // console.log('errors' ,this.data);
        if (this.data.length === 1) {
            this.data = [];
            this.closeAllSnackbars();
        } else {
            this.data = this.data.filter((err, index) => {
                return this.data[index] !== this.data[ind];
            });
        }
    }

    closeAllSnackbars() {
        this.snackBarRef.dismiss();
    }

}
