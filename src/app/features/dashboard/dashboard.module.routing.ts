import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';

const routes: Routes = [
    // Dashboard page
    {
        path: '',
        component: fromPages.DashboardComponent
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
