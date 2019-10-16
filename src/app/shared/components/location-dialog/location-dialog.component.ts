import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { DialogAnswer, DialogAnswerButton, DialogAnswerInputValue } from '../dialog/dialog.component';
import { LocationModel } from '../../../core/models/location.model';
import { LocationAutoItem } from '../form-location-dropdown/form-location-dropdown.component';
import * as _ from 'lodash';

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
        width: '440px',
        maxWidth: '440px'
    };

    // constants
    DialogAnswerButton = DialogAnswerButton;

    // local variables
    selectedLocation: LocationModel;

    /**
     * Constructor
     * @param dialogRef
     * @param data
     */
    constructor(
        public dialogRef: MatDialogRef<LocationDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: {
            message: string,
            locationId: string,
            required: boolean,
            useOutbreakLocations: boolean
        }
    ) {}

    /**
     * Close dialog
     */
    closeDialog(button: DialogAnswerButton) {
        this.dialogRef.close(new DialogAnswer(
            button,
            new DialogAnswerInputValue(this.selectedLocation)
        ));
    }

    /**
     * Location changed
     */
    locationChanged(locationItem?: LocationAutoItem) {
        // since we only need location id & name we don't need to get the entire location model
        if (locationItem) {
            this.selectedLocation = new LocationModel({
                id: locationItem.id,
                name: locationItem.label
            });
        } else {
            this.selectedLocation = undefined;
            this.data.locationId = undefined;
        }
    }

    /**
     * Locations loaded
     */
    locationsLoaded(locations: LocationAutoItem[]) {
        if (
            this.data.locationId &&
            !this.selectedLocation
        ) {
            // search for our location data
            const locationItem: LocationAutoItem = _.find(
                locations,
                {
                    id: this.data.locationId
                }
            );

            // since we only need location id & name we don't need to get the entire location model
            if (locationItem) {
                this.selectedLocation = new LocationModel({
                    id: locationItem.id,
                    name: locationItem.label
                });
            } else {
                this.selectedLocation = undefined;
            }
        }
    }
}
