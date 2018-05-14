import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';

const routes: Routes = [
    // Login
    {path: 'login', component: fromPages.LoginComponent},
    {path: 'logout', component: fromPages.LogoutComponent}
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
