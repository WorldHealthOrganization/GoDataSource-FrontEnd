import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import {
    DialogAnswer,
    DialogComponent,
    DialogConfiguration
} from '../../../shared/components/dialog/dialog.component';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';

@Injectable()
export class DialogService {
    /**
     * Constructor
     * @param dialog
     */
    constructor(private dialog: MatDialog) {}

    /**
     * Show a Confirm Dialog
     * @param message Can be either a message ( string ) or an object of type DialogConfiguration
     * @returns {Observable<DialogAnswer>}
     */
    showConfirm(messageToken: DialogConfiguration | string, translateData = {}): Observable<DialogAnswer> {
        // construct dialog message data
        const dialogMessage = DialogComponent.defaultConfigWithData(messageToken);
        (dialogMessage.data as DialogConfiguration).translateData = translateData;

        // open dialog
        return this.dialog.open(
            DialogComponent,
            dialogMessage
        ).afterClosed();
    }

    /**
     * Show o custom dialog
     * @param messageToken
     * @returns {Observable<DialogAnswer>}
     */
    showInput(messageToken: DialogConfiguration | string,
              required: boolean = true,
              translateData = {}): Observable<DialogAnswer> {
        // create input dialog configuration
        let dialogConf: DialogConfiguration = null;
        if (_.isString(messageToken)) {
            dialogConf = new DialogConfiguration(
                messageToken as string,
                undefined,
                undefined,
                undefined,
                translateData,
                true,
                required
            );
        } else {
            dialogConf = messageToken as DialogConfiguration;
            dialogConf.required = required;
            dialogConf.customInput = true;
            dialogConf.translateData = Object.keys(translateData).length > 0 ? translateData : dialogConf.translateData;
        }

        // construct dialog message data
        const dialogMessage = DialogComponent.defaultConfigWithData(dialogConf);

        // open dialog
        return this.dialog.open(
            DialogComponent,
            dialogMessage
        ).afterClosed();
    }
}

