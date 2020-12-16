import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import * as fromPages from './pages';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';

const routes: Routes = [
    // Reference Data Categories List
    {
        path: '',
        component: fromPages.ReferenceDataCategoriesListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.REFERENCE_DATA_LIST
            ]
        }
    },
    // View Reference Data Category Entries List
    {
        path: ':categoryId',
        component: fromPages.ReferenceDataCategoryEntriesListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.REFERENCE_DATA_CATEGORY_ITEM_LIST
            ]
        }
    },
    // Create new Reference Data entry
    {
        path: ':categoryId/create',
        component: fromPages.CreateReferenceDataEntryComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.REFERENCE_DATA_CATEGORY_ITEM_CREATE
            ]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View Reference Data Entry
    {
        path: ':categoryId/:entryId/view',
        component: fromPages.ModifyReferenceDataEntryComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.REFERENCE_DATA_CATEGORY_ITEM_VIEW
            ],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Reference Data entry
    {
        path: ':categoryId/:entryId/modify',
        component: fromPages.ModifyReferenceDataEntryComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.REFERENCE_DATA_CATEGORY_ITEM_MODIFY
            ],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },

    // Manage Icons - List
    {
        path: 'manage-icons/list',
        component: fromPages.ManageIconsListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.ICON_LIST
            ]
        }
    },
    // Manage Icons - Create
    {
        path: 'manage-icons/add',
        component: fromPages.ManageIconsCreateComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.ICON_CREATE
            ]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
