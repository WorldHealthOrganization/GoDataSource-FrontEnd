import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';

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
    // View User
    {
        path: ':userId/view',
        component: fromPages.ModifyUserComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_USER_ACCOUNT],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Edit user
    {
        path: ':userId/modify',
        component: fromPages.ModifyUserComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_USER_ACCOUNT],
            action: ViewModifyComponentAction.MODIFY
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
