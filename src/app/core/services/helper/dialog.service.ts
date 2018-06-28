import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { DialogConfirmComponent, DialogConfirmData } from '../../../shared/components/dialog-confirm/dialog-confirm.component';
import { I18nService } from './i18n.service';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class DialogService {


    constructor(
        private dialog: MatDialog,
        private i18nService: I18nService
    ) {}

    /**
     * Show a Confirm Dialog
     * @param message Can be either a message ( string ) or an object of type DialogConfirmData
     * @returns {Observable<R | undefined>}
     */
    showConfirm(messageToken: DialogConfirmData | string, translateData = {}) {
        // construct dialog message data
        const dialogMessage = DialogConfirmComponent.defaultConfigWithData(messageToken);
        (dialogMessage.data as DialogConfirmData).translateData = translateData;

        // open dialog
        return this.dialog.open(
            DialogConfirmComponent,
            dialogMessage
        ).afterClosed();
    }
}

