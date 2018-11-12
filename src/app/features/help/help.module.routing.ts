import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';

import * as fromPages from './pages';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';

const routes: Routes = [
    // Help items list
    {
        path: '',
        component: fromPages.HelpItemsListComponent
    },
    // Create Help Item
    {
        path: 'create',
        component: fromPages.CreateHelpItemComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_HELP]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View Help Item
    {
        path: ':itemId/view',
        component: fromPages.ModifyHelpItemComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_HELP],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Help Item
    {
        path: ':itemId/modify',
        component: fromPages.ModifyHelpItemComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_HELP],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // Help categories list
    {
        path: 'help-categories',
        component: fromPages.HelpCategoriesListComponent
    },
    // Create Help Category
    {
        path: 'create-category',
        component: fromPages.CreateHelpCategoryComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_HELP]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View Help Category
    {
        path: ':categoryId/view-category',
        component: fromPages.ModifyHelpCategoryComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_HELP],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Help Category
    {
        path: ':categoryId/modify-category',
        component: fromPages.ModifyHelpCategoryComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_HELP],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
