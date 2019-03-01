import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';
import { CaseModel } from '../../../core/models/case.model';
import { EventModel } from '../../../core/models/event.model';
import { ContactModel } from '../../../core/models/contact.model';
import { EntityType } from '../../../core/models/entity-type';
import { EntityDataService } from '../../../core/services/data/entity.data.service';
import { LabelValuePair } from '../../../core/models/label-value-pair';
import { EntityModel } from '../../../core/models/entity.model';

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

    // person model
    entity: CaseModel | ContactModel | EventModel;
    // person information as key-value pairs
    entityInfo: LabelValuePair[] = [];

    loading: boolean = true;

    // provide constants to template
    EntityType = EntityType;

    constructor(
        public dialogRef: MatDialogRef<ViewCotNodeDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ViewCOTNodeData,
        private entityDataService: EntityDataService
    ) {
        this.entity = this.data.entity;
        this.entityInfo = this.entityDataService.getLightObjectDisplay(this.entity);
    }

    closeDialog() {
        this.dialogRef.close(new DialogAnswer(
            DialogAnswerButton.Cancel
        ));
    }

    getResourceViewPageLink(): string {
        const personListLink = EntityModel.getLinkForEntityType(this.entity.type);
        return `/${personListLink}/${this.entity.id}/view`;
    }

    getPersonChainLink(): string {
        return `/transmission-chains?personId=${this.entity.id}&selectedEntityType=${this.entity.type}`;
    }
}
