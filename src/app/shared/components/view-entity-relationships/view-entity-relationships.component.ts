import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';
import {EntityModel, RelationshipModel} from '../../../core/models/entity-and-relationship.model';
import {CaseModel} from '../../../core/models/case.model';
import {ContactModel} from '../../../core/models/contact.model';
import {EventModel} from '../../../core/models/event.model';

@Component({
    selector: 'app-view-entity-relationships',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-entity-relationships.component.html',
    styleUrls: ['./view-entity-relationships.component.less']
})
export class ViewEntityRelationshipsComponent implements OnInit {

    // default settings for this type of dialog
    static DEFAULT_CONFIG = {
        autoFocus: false,
        closeOnNavigation: true,
        disableClose: false,
        hasBackdrop: true,
        width: '50%',
        maxWidth: '90%',
        data: undefined,
        panelClass: 'view-entity-relationship'
    };

    entities: CaseModel[] | ContactModel[] | EventModel[];
    entitiesRelationships: RelationshipModel[];
    constructor(
        public dialogRef: MatDialogRef<ViewEntityRelationshipsComponent>,
        @Inject(MAT_DIALOG_DATA) public data: EntityModel[],

    ) {
        console.log(this.data);
    }

    ngOnInit() {
    }

    closeDialog() {
        this.dialogRef.close(new DialogAnswer(
            DialogAnswerButton.Cancel
        ));
    }

}
