import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
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
    constructor(
        private dialog: MatDialog
    ) {}

    /**
     * Show a Confirm Dialog
     * @param {DialogConfiguration | string} messageToken - Can be either a message ( string ) or an object of type DialogConfiguration
     * @param {{}} translateData
     * @returns {Observable<DialogAnswer>}
     */
    showConfirm(
        messageToken: DialogConfiguration | string,
        translateData = {}
    ): Observable<DialogAnswer> {
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
     * Show o custom dialog with an input
     * @param {DialogConfiguration | string} messageToken
     * @param {boolean} required
     * @param {{}} translateData
     * @returns {Observable<DialogAnswer>}
     */
    showInput(
        messageToken: DialogConfiguration | string,
        required: boolean = true,
        translateData = {}
    ): Observable<DialogAnswer> {
        // create input dialog configuration
        let dialogConf: DialogConfiguration = null;
        if (_.isString(messageToken)) {
            dialogConf = new DialogConfiguration({
                message: messageToken as string,
                translateData: translateData,
                customInput: true,
                required: required
            });
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
     * Show a dialog containing data - array of objects with label and value
     * @param {any[]} data
     * @returns {Observable<DialogAnswer>}
     */
    showDataDialog(data: LabelValuePair[]): Observable<DialogAnswer> {
        // construct dialog message data
        const dialogConfig = new DialogConfiguration({
            message: '',
            data: data
        });
        const dialogComp = DialogComponent.defaultConfigWithData(dialogConfig);

        // open dialog
        return this.dialog.open(
            DialogComponent,
            dialogComp
        ).afterClosed();
    }
}


