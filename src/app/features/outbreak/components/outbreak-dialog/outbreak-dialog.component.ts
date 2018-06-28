import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Component, Inject, OnInit } from '@angular/core';
import { UserModel } from '../../../../core/models/user.model';


@Component({
    selector: 'outbreak-dialog',
    templateUrl: 'outbreak-dialog.component.html'
})
export class OutbreakDialogComponent implements OnInit {

    users: UserModel[];

    constructor(
        private dialogRef: MatDialogRef<OutbreakDialogComponent>,
        @Inject(MAT_DIALOG_DATA) data) {

        this.users = data.users;
    }

    ngOnInit() {
    }

    close() {
        this.dialogRef.close();
    }
}
