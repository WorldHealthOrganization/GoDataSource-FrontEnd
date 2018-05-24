import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';

const routes: Routes = [
    {
        path: 'change-password',
        component: fromPages.ChangePasswordComponent
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
