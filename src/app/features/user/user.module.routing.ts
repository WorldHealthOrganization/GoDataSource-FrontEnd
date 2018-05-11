import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/helper/auth-guard.service';
import { PERMISSION } from '../../core/models/user-role.model';

const routes: Routes = [
    // Users list
    {
        path: '',
        component: fromPages.UserListComponent
    },
    // Create User
    {
        path: 'create',
        component: fromPages.CreateUserComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_USER_ACCOUNT]
        }
    },
    // View User
    {
        path: ':userId',
        component: fromPages.ViewUserComponent
    },
    // Edit user
    {
        path: ':userId/modify',
        component: fromPages.ModifyUserComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_USER_ACCOUNT]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
