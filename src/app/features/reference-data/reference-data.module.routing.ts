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
        component: fromPages.ReferenceDataCategoriesListComponent
    },
    // View Reference Data Category Entries List
    {
        path: ':categoryId',
        component: fromPages.ReferenceDataCategoryEntriesListComponent,
    },
    // Create new Reference Data entry
    {
        path: ':categoryId/create',
        component: fromPages.CreateReferenceDataEntryComponent,
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
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Reference Data entry
    {
        path: ':categoryId/:entryId/modify',
        component: fromPages.ModifyReferenceDataEntryComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_REFERENCE_DATA],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
