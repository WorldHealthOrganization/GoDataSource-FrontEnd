import { RouterModule, Routes } from '@angular/router';
import { ModuleWithProviders } from '@angular/compiler/src/core';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { PermissionExpression } from '../../core/models/user.model';

const routes: Routes = [
    {
        path: '',
        component: fromPages.SavedFiltersComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: new PermissionExpression({
                or: [
                    PERMISSION.CASE_LIST,
                    PERMISSION.FOLLOW_UP_LIST,
                    PERMISSION.CONTACT_LIST,
                    PERMISSION.CASE_LIST_LAB_RESULT,
                    PERMISSION.CONTACT_LIST_LAB_RESULT,
                    PERMISSION.LAB_RESULT_LIST,
                    PERMISSION.CASE_CHANGE_SOURCE_RELATIONSHIP,
                    PERMISSION.CONTACT_CHANGE_SOURCE_RELATIONSHIP,
                    PERMISSION.EVENT_CHANGE_SOURCE_RELATIONSHIP,
                    PERMISSION.RELATIONSHIP_CREATE,
                    PERMISSION.RELATIONSHIP_SHARE
                ]
            })
        }
    }
];

export const routing: ModuleWithProviders =  RouterModule.forChild(routes);
