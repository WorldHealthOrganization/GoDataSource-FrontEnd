import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';
import { CaseModel } from '../../../core/models/case.model';
import { EventModel } from '../../../core/models/event.model';
import { ContactModel } from '../../../core/models/contact.model';

export class ViewCOTNodeData {
    constructor(
        public entity: CaseModel | EventModel | ContactModel
    ) {}
}

@Component({
    selector: 'app-view-cot-node-dialog',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-cot-node-dialog.component.html',
    styleUrls: ['./view-cot-node-dialog.component.less']
})
export class ViewCotNodeDialogComponent {
    // default settings for this type of dialog
    static DEFAULT_CONFIG = {
        autoFocus: false,
        closeOnNavigation: true,
        disableClose: false,
        hasBackdrop: true,
        width: '90%',
        maxWidth: '90%',
        data: undefined,
        panelClass: 'dialog-view-cot-node'
    };

    loading: boolean = true;

    constructor(
        public dialogRef: MatDialogRef<ViewCotNodeDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ViewCOTNodeData,
    ) {}

    closeDialog() {
        this.dialogRef.close(new DialogAnswer(
            DialogAnswerButton.Cancel
        ));
    }
}
