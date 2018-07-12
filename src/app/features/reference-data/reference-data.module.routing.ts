import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/helper/auth-guard.service';

const routes: Routes = [
    // Reference Data Categories List
    {
        path: '',
        component: fromPages.ReferenceDataCategoriesListComponent
    },
    // Reference Data Category Entries List
    {
        path: ':categoryId',
        component: fromPages.ReferenceDataCategoryEntriesListComponent
    },
    // Create new Reference Data entry
    {
        path: ':categoryId/create',
        component: fromPages.CreateReferenceDataEntryComponent
    },
    // Modify Reference Data entry
    {
        path: ':categoryId/:entryId',
        component: fromPages.ModifyReferenceDataEntryComponent
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
