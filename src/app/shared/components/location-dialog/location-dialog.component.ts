import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
    selector: 'app-location-dialog',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './location-dialog.component.html',
    styleUrls: ['./location-dialog.component.less']
})
export class LocationDialogComponent {
    // default settings for this type of dialog
    static DEFAULT_CONFIG = {
        autoFocus: false,
        closeOnNavigation: false,
        disableClose: true,
        hasBackdrop: true,
        panelClass: 'dialog-location',
        data: undefined,
        width: '440px'
    };

    /**
     * Constructor
     * @param dialogRef
     * @param data
     */
    constructor(
        public dialogRef: MatDialogRef<LocationDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: {
            locationId: string,
            required: boolean,
            useOutbreakLocations: boolean
        }
    ) {}
}
