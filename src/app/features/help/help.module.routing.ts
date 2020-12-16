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
        component: fromPages.HelpSearchComponent,
        canActivate: [AuthGuard]
        // NO permissions required, only to be authenticated
    },
    // Help view single item
    {
        path: 'categories/:categoryId/items/:itemId/view-global',
        component: fromPages.ViewHelpComponent,
        canActivate: [AuthGuard]
        // NO permissions required, only to be authenticated
    },
    // Help categories list
    {
        path: 'categories',
        component: fromPages.HelpCategoriesListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.HELP_CATEGORY_LIST
            ],
        }
    },
    // Create Help Category
    {
        path: 'categories/create',
        component: fromPages.CreateHelpCategoryComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.HELP_CATEGORY_CREATE
            ]
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
            permissions: [
                PERMISSION.HELP_CATEGORY_VIEW
            ],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Help Category
    {
        path: 'categories/:categoryId/modify',
        component: fromPages.ModifyHelpCategoryComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.HELP_CATEGORY_MODIFY
            ],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // Help categories list
    {
        path: 'categories/:categoryId/items',
        component: fromPages.HelpItemsListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.HELP_CATEGORY_ITEM_LIST
            ]
        }
    },
    // Create Help Item
    {
        path: 'categories/:categoryId/items/create',
        component: fromPages.CreateHelpItemComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.HELP_CATEGORY_ITEM_CREATE
            ]
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
            permissions: [
                PERMISSION.HELP_CATEGORY_ITEM_VIEW
            ],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Help Item
    {
        path: 'categories/:categoryId/items/:itemId/modify',
        component: fromPages.ModifyHelpItemComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.HELP_CATEGORY_ITEM_MODIFY
            ],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    }

];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
