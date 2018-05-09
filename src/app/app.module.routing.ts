import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
    {path: '', redirectTo: '/login', pathMatch: 'full'},
    // Authentication Module routes
    {path: '', loadChildren: './modules/authentication/authentication.module#AuthenticationModule'},
    // User Module routes
    {path: 'users', loadChildren: './modules/user/user.module#UserModule'},
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
