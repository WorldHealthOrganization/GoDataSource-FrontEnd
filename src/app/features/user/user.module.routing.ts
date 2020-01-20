import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';

const routes: Routes = [
    // Users list
    {
        path: '',
        component: fromPages.UserListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.USER_LIST
            ]
        }
    },
    // Create User
    {
        path: 'create',
        component: fromPages.CreateUserComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.USER_CREATE
            ]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View User
    {
        path: ':userId/view',
        component: fromPages.ModifyUserComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.USER_VIEW
            ],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Edit user
    {
        path: ':userId/modify',
        component: fromPages.ModifyUserComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.USER_MODIFY
            ],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
