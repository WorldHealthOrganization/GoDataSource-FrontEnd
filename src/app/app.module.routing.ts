import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from './core/services/helper/auth-guard.service';
import { PERMISSION } from './core/models/user-role.model';

import { AuthenticatedComponent } from './core/components/authenticated/authenticated.component';

const routes: Routes = [
    // Authentication Module routes
    {
        path: 'login',
        loadChildren: './features/authentication/authentication.module#AuthenticationModule'
    },

    // Routes for authenticated users
    {
        path: '',
        component: AuthenticatedComponent,
        children: [
            // User Module routes
            {
                path: 'users',
                loadChildren: './features/user/user.module#UserModule',
                canActivate: [AuthGuard],
                data: {
                    permissions: [PERMISSION.READ_USER_ACCOUNT]
                }
            },
        ]
    },
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
