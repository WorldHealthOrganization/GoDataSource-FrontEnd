import { Component, Inject, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';
import { CaseModel } from '../../../core/models/case.model';
import { EventModel } from '../../../core/models/event.model';
import { ContactModel } from '../../../core/models/contact.model';
import { EntityType } from '../../../core/models/entity-type';
import { EntityDataService } from '../../../core/services/data/entity.data.service';
import { LabelValuePair } from '../../../core/models/label-value-pair';
import { EntityModel } from '../../../core/models/entity-and-relationship.model';
import * as _ from 'lodash';
import { ContactOfContactModel } from '../../../core/models/contact-of-contact.model';

/**
 * Node Data
 */
export class ViewCOTNodeData {
    constructor(
        public entity: CaseModel | EventModel | ContactModel,
        public displayPersonalCotLink: boolean,
        public snapshotId?: string,
        public showPersonContacts?: boolean,
        public showPersonContactsOfContacts?: boolean,
    ) {}
}

@Component({
    selector: 'app-view-cot-node-dialog',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-cot-node-dialog.component.html',
    styleUrls: ['./view-cot-node-dialog.component.less']
})
export class ViewCotNodeDialogComponent implements OnDestroy {
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
    entity: CaseModel | ContactModel | EventModel | ContactOfContactModel;
    // person information as key-value pairs
    entityInfo: LabelValuePair[] = [];

    // check if entity have relationship
    displayPersonChainOfTransmissionLink: boolean = false;

    loading: boolean = true;

    // provide constants to template
    EntityType = EntityType;

    // used to determine data size since we can't do it with flex without a min-height
    @ViewChild('dialogTitle') dialogTitle: any;
    @ViewChild('dialogButtons') dialogButtons: any;

    // dialog data max height
    private _timerHandler: any;
    dialogDataMaxHeight: string;

    resourceViewPageLink: string;
    personChainLink: string;

    /**
     * Constructor
     */
    constructor(
        public dialogRef: MatDialogRef<ViewCotNodeDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ViewCOTNodeData,
        private entityDataService: EntityDataService
    ) {
        this.entity = this.data.entity;
        this.entityInfo = this.entityDataService.getLightObjectDisplay(this.entity);
        this.displayPersonChainOfTransmissionLink = this.data.displayPersonalCotLink;

        const personListLink = EntityModel.getLinkForEntityType(this.entity.type);
        this.resourceViewPageLink = `/${personListLink}/${this.entity.id}/view`;
        this.personChainLink = `/transmission-chains?personId=${this.entity.id}&selectedEntityType=${this.entity.type}`;

        // add optional params
        if (!!this.data.snapshotId) {
            this.personChainLink = this.personChainLink + `&snapshotId=${this.data.snapshotId}`;
        }

        if (!!this.data.showPersonContacts) {
            this.personChainLink = this.personChainLink + `&showPersonContacts=${this.data.showPersonContacts}`;
        }

        if (!!this.data.showPersonContactsOfContacts) {
            this.personChainLink = this.personChainLink + `&showPersonContactsOfContacts=${this.data.showPersonContactsOfContacts}`;
        }

        // init timer handler
        this.initTimerHandler();
    }

    /**
     * Component destroyed
     */
    ngOnDestroy() {
        this.destroyTimerHandler();
    }

    /**
     * Close dialog
     */
    closeDialog() {
        this.dialogRef.close(new DialogAnswer(
            DialogAnswerButton.Cancel
        ));
    }

    /**
     * Destroy timer handler
     */
    destroyTimerHandler() {
        // nothing to destroy ?
        if (!this._timerHandler) {
            return;
        }

        // destroy timer
        clearTimeout(this._timerHandler);
        this._timerHandler = null;
    }

    /**
     * Init timer
     */
    initTimerHandler() {
        // destroy timer
        this.destroyTimerHandler();

        // handle dialog changes
        this._timerHandler = setTimeout(() => {
            this.determineDataMaxHeight();
        }, 400);
    }

    /**
     * Determine form max height
     */
    determineDataMaxHeight() {
        // prepare for next refresh
        this.initTimerHandler();

        // default max height
        this.dialogDataMaxHeight = '300px';

        // can we determine the container max height ?
        if (
            !document ||
            !document.defaultView ||
            !document.defaultView.getComputedStyle ||
            !this.dialogRef ||
            !(this.dialogRef as any)._containerInstance ||
            !(this.dialogRef as any)._containerInstance._elementRef ||
            !(this.dialogRef as any)._containerInstance._elementRef.nativeElement
        ) {
            return;
        }

        // determine parent max height
        const containerInstance = (this.dialogRef as any)._containerInstance._elementRef.nativeElement;
        const computedStyle = document.defaultView.getComputedStyle(containerInstance);
        let maxContainerInstanceMaxHeight: number;
        try {
            maxContainerInstanceMaxHeight = _.parseInt(computedStyle.getPropertyValue('max-height'));
        } catch (e) {
            maxContainerInstanceMaxHeight = 0;
        }
        let maxContainerInstancePaddingTop: number;
        try {
            maxContainerInstancePaddingTop = _.parseInt(computedStyle.getPropertyValue('padding-top'));
        } catch (e) {
            maxContainerInstancePaddingTop = 0;
        }
        let maxContainerInstancePaddingBottom: number;
        try {
            maxContainerInstancePaddingBottom = _.parseInt(computedStyle.getPropertyValue('padding-bottom'));
        } catch (e) {
            maxContainerInstancePaddingBottom = 0;
        }

        // determine how much we should substract
        const dialogTitleHeight: number = this.dialogTitle && this.dialogTitle.nativeElement ?
            this.dialogTitle.nativeElement.offsetHeight :
            0;
        const dialogTitleMarginBottom: number = this.dialogTitle && this.dialogTitle.nativeElement ?
            15 :
            0;
        const dialogButtonsHeight: number = this.dialogButtons && this.dialogButtons.nativeElement ?
            this.dialogButtons.nativeElement.offsetHeight :
            0;

        // do the math
        const childrenHeight: number = dialogTitleHeight + dialogTitleMarginBottom + dialogButtonsHeight;
        const heightUsed: number = maxContainerInstancePaddingTop + maxContainerInstancePaddingBottom + childrenHeight;
        this.dialogDataMaxHeight = `${maxContainerInstanceMaxHeight - heightUsed}px`;
    }
}
