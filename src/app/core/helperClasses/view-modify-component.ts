import { ActivatedRoute } from '@angular/router';
import { ConfirmOnFormChanges } from '../services/guards/page-change-confirmation-guard.service';
import { DialogService } from '../services/helper/dialog.service';
import { LoadingDialogModel } from '../../shared/components';

/**
 * View / Modify Action Types
 */
export enum ViewModifyComponentAction {
    VIEW = 'view',
    MODIFY = 'modify'
}

/**
 * Base class to be extended by components that need to implement view / modify behaviour
 */
export abstract class ViewModifyComponent extends ConfirmOnFormChanges {
    // read-only ?
    public viewOnly: boolean = false;

    // handler to loading dialog
    private _showLoadingDialog: boolean;
    private _loadingDialog: LoadingDialogModel;

    /**
     * Constructor
     */
    protected constructor(
        protected route: ActivatedRoute,
        protected dialogService: DialogService
    ) {
        // create parent :)
        super();

        // determine what kind of view we should display
        route.data.subscribe((data: { action: ViewModifyComponentAction }) => {
            // since we have only two types this should be enough for now
            this.viewOnly = data.action === ViewModifyComponentAction.VIEW;
        });
    }

    /**
     * Show Loading dialog
     */
    public showLoadingDialog(instant: boolean = true) {
        // no need to display loading dialog
        this._showLoadingDialog = true;

        // show dialog
        if (instant) {
            if (!this._loadingDialog) {
                this._loadingDialog = this.dialogService.showLoadingDialog();
            }
        } else {
            if (!this._loadingDialog) {
                setTimeout(() => {
                    if (
                        !this._loadingDialog &&
                        this._showLoadingDialog
                    ) {
                        this._loadingDialog = this.dialogService.showLoadingDialog();
                    }
                });
            }
        }
    }

    /**
     * Hide Loading dialog
     */
    public hideLoadingDialog() {
        // no need to display loading dialog
        this._showLoadingDialog = false;

        // hide dialog
        if (this._loadingDialog) {
            this._loadingDialog.close();
            this._loadingDialog = null;
        } else {
            setTimeout(() => {
                if (this._loadingDialog) {
                    this._loadingDialog.close();
                    this._loadingDialog = null;
                }
            });
        }
    }
}
