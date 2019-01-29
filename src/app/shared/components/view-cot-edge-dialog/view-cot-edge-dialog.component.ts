import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';
import { LabelValuePair } from '../../../core/models/label-value-pair';
import { RelationshipModel } from '../../../core/models/relationship.model';
import { RelationshipDataService } from '../../../core/services/data/relationship.data.service';

export class ViewCOTEdgeData {
    constructor(
        public relationship: RelationshipModel
    ) {}
}

@Component({
    selector: 'app-view-cot-edge-dialog',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-cot-edge-dialog.component.html',
    styleUrls: ['./view-cot-edge-dialog.component.less']
})
export class ViewCotEdgeDialogComponent {
    // default settings for this type of dialog
    static DEFAULT_CONFIG = {
        autoFocus: false,
        closeOnNavigation: true,
        disableClose: false,
        hasBackdrop: true,
        width: '90%',
        maxWidth: '90%',
        data: undefined,
        panelClass: 'dialog-view-cot-edge'
    };

    // relationship model
    relationship: RelationshipModel;
    // relationship information as key-value pairs
    relationshipInfo: LabelValuePair[] = [];

    loading: boolean = true;

    constructor(
        public dialogRef: MatDialogRef<ViewCotEdgeDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ViewCOTEdgeData,
        private relationshipDataService: RelationshipDataService
    ) {
        this.relationship = this.data.relationship;
        this.relationshipInfo = this.relationshipDataService.getLightObjectDisplay(this.relationship);
    }

    closeDialog() {
        this.dialogRef.close(new DialogAnswer(
            DialogAnswerButton.Cancel
        ));
    }

    getResourceViewPageLink(): string {
        // get source person
        const sourcePerson = this.relationship.sourcePerson;

        if (sourcePerson) {
            return `/relationships/${sourcePerson.type}/${sourcePerson.id}/${this.relationship.id}/view`;
        }

        return null;
    }
}
