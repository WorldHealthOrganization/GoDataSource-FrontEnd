import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';
import { CaseModel } from '../../../core/models/case.model';
import { EventModel } from '../../../core/models/event.model';
import { ContactModel } from '../../../core/models/contact.model';
import { EntityType } from '../../../core/models/entity-type';
import { EntityDataService } from '../../../core/services/data/entity.data.service';
import { LabelValuePair } from '../../../core/models/label-value-pair';
import { EntityModel } from '../../../core/models/entity-and-relationship.model';
import { SnackbarService } from '../../../core/services/helper/snackbar.service';
import { throwError } from 'rxjs/index';
import { catchError, filter } from 'rxjs/internal/operators';

export class ViewCOTNodeData {
    constructor(
        public entity: CaseModel | EventModel | ContactModel,
        public showContactsFilter: boolean
    ) {}
}

@Component({
    selector: 'app-view-cot-node-dialog',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-cot-node-dialog.component.html',
    styleUrls: ['./view-cot-node-dialog.component.less']
})
export class ViewCotNodeDialogComponent implements OnInit {
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

    // check if entity have relationship
    displayPersonChainOfTransmissionLink: boolean = false;
    showContactsFilter: boolean = false;

    loading: boolean = true;

    // provide constants to template
    EntityType = EntityType;

    constructor(
        public dialogRef: MatDialogRef<ViewCotNodeDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ViewCOTNodeData,
        private entityDataService: EntityDataService,
        private snackbarService: SnackbarService
    ) {
        this.entity = this.data.entity;
        this.entityInfo = this.entityDataService.getLightObjectDisplay(this.entity);
        this.showContactsFilter = this.data.showContactsFilter;
    }

    ngOnInit() {
        // check if we have relationships to show in COT
        this.entityDataService.checkRelationshipsCount(
            this.entity.outbreakId,
            this.entity.type,
            this.entity.id)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    return throwError(err);
                }))
            .subscribe((relationshipCount: {count: number}) => {
                console.log(relationshipCount);
                if (relationshipCount.count > 0 ) {
                    this.displayPersonChainOfTransmissionLink = true;
                }
            });
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
