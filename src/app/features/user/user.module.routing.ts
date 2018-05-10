import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';

const routes: Routes = [
    // Users list
    {path: '', component: fromPages.UserListComponent},
    // View User
    {path: ':userId', component: fromPages.ViewUserComponent},
    // Create User
    {path: 'create', component: fromPages.CreateUserComponent},
    // Edit user
    {path: ':userId/modify', component: fromPages.ModifyUserComponent}
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
