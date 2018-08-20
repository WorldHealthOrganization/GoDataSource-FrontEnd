import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';

const routes: Routes = [
    // Reference Data Categories List
    {
        path: '',
        component: fromPages.ReferenceDataCategoriesListComponent
    },
    // View Reference Data Category Entries List
    {
        path: ':categoryId/view',
        component: fromPages.ReferenceDataCategoryEntriesListComponent,
        data : {
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Reference Data Category Entries List
    {
        path: ':categoryId/modify',
        component: fromPages.ReferenceDataCategoryEntriesListComponent,
        data : {
            action: ViewModifyComponentAction.MODIFY
        }
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
