import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';

const routes: Routes = [
    {
        path: '',
        component: fromPages.SystemConfigComponent
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);