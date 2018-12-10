import { Component, ViewEncapsulation } from '@angular/core';
import { Subscriber } from 'rxjs/Subscriber';
export class LoadingDialogModel {
    constructor(
        private subscriber: Subscriber<void>
    ) {}
    /**
     * Close Dialog
     */
    close() {
        this.subscriber.next();
        this.subscriber.complete();
    }
}
@Component({
    selector: 'app-loading-dialog',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './loading-dialog.component.html',
    styleUrls: ['./loading-dialog.component.less']
})
export class LoadingDialogComponent {
    // default settings for this type of dialog
    static DEFAULT_CONFIG = {
        autoFocus: false,
        closeOnNavigation: false,
        disableClose: true,
        hasBackdrop: true
    };
    constructor() {}
}
