import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from './core/services/helper/auth-guard.service';
import { PERMISSION } from './core/models/user-role.model';

const routes: Routes = [
    {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full'
    },
    // Authentication Module routes
    {
        path: '',
        loadChildren: './features/authentication/authentication.module#AuthenticationModule'
    },
    // User Module routes
    {
        path: 'users',
        loadChildren: './features/user/user.module#UserModule',
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_USER_ACCOUNT]
        }
    },
    // Outbreaks Module routes
    {
        path: 'outbreaks',
        loadChildren: './features/outbreak/outbreak.module#OutbreakModule',
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_OUTBREAK]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
