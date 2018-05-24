import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/helper/auth-guard.service';
import { PERMISSION } from '../../core/models/user-role.model';

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
    // Modify Role
    {
        path: ':roleId/modify',
        component: fromPages.ModifyRoleComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_ROLE]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
