import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';

const routes: Routes = [
    // Roles list
    {
        path: '',
        component: fromPages.RolesListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.USER_ROLE_LIST
            ]
        }
    },
    // Create new Role
    {
        path: 'create',
        component: fromPages.CreateRoleComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.USER_ROLE_CREATE
            ]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View Role
    {
        path: ':roleId/view',
        component: fromPages.ModifyRoleComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.USER_ROLE_VIEW
            ],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Role
    {
        path: ':roleId/modify',
        component: fromPages.ModifyRoleComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.USER_ROLE_MODIFY
            ],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
