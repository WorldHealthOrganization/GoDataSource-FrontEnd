import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from './core/services/helper/auth-guard.service';
import { PERMISSION } from './core/models/permission.model';

import { AuthenticatedComponent } from './core/components/authenticated/authenticated.component';
import { LanguageResolverService } from './core/services/resolvers/language-resolver.service';

const routes: Routes = [
    // Authentication Module routes
    {
        path: 'auth',
        loadChildren: './features/authentication/authentication.module#AuthenticationModule',
        resolve: {
            res: LanguageResolverService
        }
    },

    // Routes for authenticated users
    {
        path: '',
        component: AuthenticatedComponent,
        resolve: {
            res: LanguageResolverService
        },
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
            },
            // Relationship Module routes
            {
                path: 'relationships',
                loadChildren: './features/relationship/relationship.module#RelationshipModule'
            },
            // Reference Data Module routes
            {
                path: 'reference-data',
                loadChildren: './features/reference-data/reference-data.module#ReferenceDataModule',
                canActivate: [AuthGuard],
                data: {
                    permissions: [PERMISSION.WRITE_REFERENCE_DATA]
                }
            },
            // Locations Module routes
            {
                path: 'locations',
                loadChildren: './features/location/location.module#LocationModule',
                canActivate: [AuthGuard],
                data: {
                    permissions: [PERMISSION.READ_SYS_CONFIG]
                }
            },
            // Dashboard Module routes
            {
                path: 'dashboard',
                loadChildren: './features/dashboard/dashboard.module#DashboardModule'
            },
            // Transmission Chain Module routes
            {
                path: 'transmission-chains',
                loadChildren: './features/transmission-chain/transmission-chain.module#TransmissionChainModule'
            }
        ]
    },
    {
        // for unknown routes, redirect to home page
        path: '**',
        redirectTo: '/'
    }

];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
