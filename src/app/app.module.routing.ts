import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from './core/services/helper/auth-guard.service';
import { PERMISSION } from './core/models/user-role.model';

import { AuthenticatedComponent } from './core/components/authenticated/authenticated.component';

const routes: Routes = [
    // Authentication Module routes
    {
        path: 'auth',
        loadChildren: './features/authentication/authentication.module#AuthenticationModule'
    },

    // Routes for authenticated users
    {
        path: '',
        component: AuthenticatedComponent,
        children: [
            // Account Module routes
            {
                path: 'account',
                loadChildren: './features/account/account.module#AccountModule',
                canActivate: [AuthGuard]
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
            // User Role Module routes
            {
                path: 'user-roles',
                loadChildren: './features/user-role/user-role.module#UserRoleModule',
                canActivate: [AuthGuard],
                data: {
                    permissions: [PERMISSION.READ_ROLE]
                }
            },
        ]
    },
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
