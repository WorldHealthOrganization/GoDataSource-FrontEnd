import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';
import { HelpDataService } from '../../../core/services/data/help.data.service';
import { HelpItemModel } from '../../../core/models/help-item.model';

export class ViewHelpDetailsData {
    categoryId: string;
    itemId: string;

    constructor(data?: {
        categoryId?: string,
        itemId?: string
    }) {
        if (data) {
            Object.assign(
                this,
                data
            );
        }
    }
}

@Component({
    selector: 'app-view-help-details-dialog',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-help-details-dialog.component.html',
    styleUrls: ['./view-help-details-dialog.component.less']
})
export class ViewHelpDetailsDialogComponent {
    // default settings for this type of dialog
    static DEFAULT_CONFIG = {
        autoFocus: false,
        closeOnNavigation: true,
        disableClose: false,
        hasBackdrop: true,
        data: undefined,
        panelClass: 'dialog-view-help-details',
        width: '90%',
        maxWidth: '90%',
        height: '95vh'
    };

    // help item data
    helpItemData: HelpItemModel = new HelpItemModel();

    /**
     * Constructor
     */
    constructor(
        public dialogRef: MatDialogRef<ViewHelpDetailsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ViewHelpDetailsData,
        private helpDataService: HelpDataService
    ) {
        this.helpDataService
            .getHelpItem(this.data.categoryId, this.data.itemId)
            .subscribe(helpItemData => {
                this.helpItemData = new HelpItemModel(helpItemData);
            });
    }

    /**
     * Close Dialog
     */
    closeDialog() {
        this.dialogRef.close(new DialogAnswer(
            DialogAnswerButton.Cancel
        ));
    }
}
