import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import * as fromPages from './pages';

const routes: Routes = [
    // Duplicate records list
    {
        path: '',
        component: fromPages.DuplicateRecordsListComponent
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
