import { ActivatedRoute } from '@angular/router';
import { ConfirmOnFormChanges } from '../services/guards/page-change-confirmation-guard.service';

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
    public viewOnly: boolean = false;

    protected constructor(
        protected route: ActivatedRoute,
    ) {
        // create parent :)
        super();

        // determine what kind of view we should display
        route.data.subscribe((data: { action: ViewModifyComponentAction }) => {
            // since we have only two types this should be enough for now
            this.viewOnly = data.action === ViewModifyComponentAction.VIEW;
        });
    }
}
