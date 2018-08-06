import { ActivatedRoute } from '@angular/router';

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
export abstract class ViewModifyComponent {
    public viewOnly: boolean = false;

    protected constructor(
        protected route: ActivatedRoute,
    ) {
        // determine what kind of view we should display
        route.data.subscribe((data: { action: ViewModifyComponentAction }) => {
            // since we have only two types this should be enough for now
            this.viewOnly = data.action === ViewModifyComponentAction.VIEW;
        });
    }
}
