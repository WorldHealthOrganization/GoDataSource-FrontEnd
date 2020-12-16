import { Component, Inject, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';
import { LabelValuePair } from '../../../core/models/label-value-pair';
import { RelationshipDataService } from '../../../core/services/data/relationship.data.service';
import { RelationshipModel } from '../../../core/models/entity-and-relationship.model';
import * as _ from 'lodash';

/**
 * Edge Data
 */
export class ViewCOTEdgeData {
    constructor(
        public relationship: RelationshipModel,
        public showResourceViewPageLink?: boolean
    ) {}
}

@Component({
    selector: 'app-view-cot-edge-dialog',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-cot-edge-dialog.component.html',
    styleUrls: ['./view-cot-edge-dialog.component.less']
})
export class ViewCotEdgeDialogComponent implements OnDestroy {
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
    showResourceViewPageLink: boolean = true;

    loading: boolean = true;

    // used to determine data size since we can't do it with flex without a min-height
    @ViewChild('dialogTitle') dialogTitle: any;
    @ViewChild('dialogButtons') dialogButtons: any;

    // dialog data max height
    private _timerHandler: any;
    dialogDataMaxHeight: string;

    resourceViewPageLink: string;

    /**
     * Constructor
     */
    constructor(
        public dialogRef: MatDialogRef<ViewCotEdgeDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ViewCOTEdgeData,
        private relationshipDataService: RelationshipDataService
    ) {
        this.relationship = this.data.relationship;
        this.relationshipInfo = this.relationshipDataService.getLightObjectDisplay(this.relationship);

        // determine relationship link
        const sourcePerson = this.relationship.sourcePerson;
        this.resourceViewPageLink = sourcePerson ?
            `/relationships/${sourcePerson.type}/${sourcePerson.id}/contacts/${this.relationship.id}/view` :
            null;

        this.showResourceViewPageLink = this.data.showResourceViewPageLink;

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
