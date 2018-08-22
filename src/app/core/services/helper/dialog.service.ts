import { Inject, Injectable } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import {
    DialogAnswer,
    DialogComponent,
    DialogConfiguration
} from '../../../shared/components/dialog/dialog.component';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { LabelValuePair } from '../../models/label-value-pair';

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
     * @returns {Observable<R | undefined>}
     */
    showConfirm(messageToken: DialogConfiguration | string, translateData = {}) {
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
     * @returns {Observable<undefined|R>}
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

    /**
     * Show a dialog containing data - array { key: value }
     * @param {any[]} data
     * @returns {Observable<any>}
     */
    showDataDialog(data: LabelValuePair[]) {
        // construct dialog message data
        const dialogConfig = new DialogConfiguration(
            '',
            undefined,
            undefined,
            undefined,
            {},
            false,
            false,
            data
        );
        const dialogComp = DialogComponent.defaultConfigWithData(dialogConfig);

        // open dialog
        return this.dialog.open(
            DialogComponent,
            dialogComp
        ).afterClosed();
    }
}


