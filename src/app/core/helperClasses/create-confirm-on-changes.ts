import { ConfirmOnFormChanges } from '../services/guards/page-change-confirmation-guard.service';
import { IPermissionBasic } from '../models/permission.interface';
import { UserModel } from '../models/user.model';
import { Router } from '@angular/router';
import { RedirectService } from '../services/helper/redirect.service';

/**
 * Add methods specific to create component & extends ConfirmOnFormChanges functionality
 */
export abstract class CreateConfirmOnChanges
    extends ConfirmOnFormChanges {

    /**
     * Redirect to proper page after create
     */
    redirectToProperPageAfterCreate(
        router: Router,
        redirectService: RedirectService,
        authUser: UserModel,
        model: IPermissionBasic,
        routePath: string,
        recordID: string
    ) {
        // navigate to proper page
        this.disableDirtyConfirm();
        if (model.canModify(authUser)) {
            router.navigate([`/${routePath}/${recordID}/modify`]);
        } else if (model.canView(authUser)) {
            router.navigate([`/${routePath}/${recordID}/view`]);
        } else if (model.canList(authUser)) {
            router.navigate([`/${routePath}`]);
        } else {
            // fallback to current page since we already know that we have access to this page
            redirectService.to([`/${routePath}/create`]);
        }
    }
}
