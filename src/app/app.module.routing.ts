import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from './core/services/helper/auth-guard.service';
import { PERMISSION } from './core/models/permission.model';

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
            // Outbreak Module routes
            {
                path: 'outbreaks',
                loadChildren: './features/outbreak/outbreak.module#OutbreakModule',
                canActivate: [AuthGuard],
                data: {
                    permissions: [PERMISSION.READ_OUTBREAK]
                }
            },
            // Contacts Module routes
            {
                path: 'contacts',
                loadChildren: './features/contact/contact.module#ContactModule',
                canActivate: [AuthGuard],
                data: {
                    permissions: [PERMISSION.READ_CONTACT]
                }
            },
            // Case Module routes
            {
                path: 'cases',
                loadChildren: './features/case/case.module#CaseModule',
                canActivate: [AuthGuard],
                data: {
                    permissions: [PERMISSION.READ_CASE]
                }
            },
            // Event Module routes
            {
                path: 'events',
                loadChildren: './features/event/event.module#EventModule',
                canActivate: [AuthGuard],
                data: {
                    permissions: [PERMISSION.READ_EVENT]
                }
            }
        ]
    },
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
