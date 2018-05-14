import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';

const routes: Routes = [
    // Login
    {path: '', component: fromPages.LoginComponent}
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
