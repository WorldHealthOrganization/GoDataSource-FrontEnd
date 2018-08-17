import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/helper/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';

const routes: Routes = [
    // Roles list
    {
        path: '',
        component: fromPages.RolesListComponent
    },
    // Create new Role
    {
        path: 'create',
        component: fromPages.CreateRoleComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_ROLE]
        }
    },
    // View Role
    {
        path: ':roleId/view',
        component: fromPages.ModifyRoleComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_ROLE],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Role
    {
        path: ':roleId/modify',
        component: fromPages.ModifyRoleComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_ROLE],
            action: ViewModifyComponentAction.MODIFY
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
