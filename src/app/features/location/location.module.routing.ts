import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';

const routes: Routes = [
    // Locations list
    {
        path: '',
        component: fromPages.LocationsListComponent
    },
    // Location parent
    {
        path: ':parentId/children',
        component: fromPages.LocationsListComponent
    },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
