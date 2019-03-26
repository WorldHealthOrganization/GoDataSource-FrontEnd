import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';

import * as fromPages from './pages';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';

const routes: Routes = [
    // Help view / search
    {
        path: '',
        component: fromPages.HelpSearchComponent
    },
    // Help view single item
    {
        path: 'categories/:categoryId/items/:itemId/view-global',
        component: fromPages.ViewHelpComponent
    },
    // Help categories list
    {
        path: 'categories',
        component: fromPages.HelpCategoriesListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_HELP],
        }
    },
    // Create Help Category
    {
        path: 'categories/create',
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
        path: 'categories/:categoryId/view',
        component: fromPages.ModifyHelpCategoryComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_HELP],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Help Category
    {
        path: 'categories/:categoryId/modify',
        component: fromPages.ModifyHelpCategoryComponent,
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
        path: 'categories/:categoryId/items',
        component: fromPages.HelpItemsListComponent
    },
    // Create Help Item
    {
        path: 'categories/:categoryId/items/create',
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
        path: 'categories/:categoryId/items/:itemId/view',
        component: fromPages.ModifyHelpItemComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_HELP],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Help Item
    {
        path: 'categories/:categoryId/items/:itemId/modify',
        component: fromPages.ModifyHelpItemComponent,
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
