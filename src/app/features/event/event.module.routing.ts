import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';

const routes: Routes = [
    // Events list
    {
        path: '',
        component: fromPages.EventsListComponent
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
