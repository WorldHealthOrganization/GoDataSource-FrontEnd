import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from './core/services/guards/auth-guard.service';
import { PERMISSION } from './core/models/permission.model';

import { AuthenticatedComponent } from './core/components/authenticated/authenticated.component';
import { LanguageResolver } from './core/services/resolvers/language.resolver';
import { ModulePath } from './core/enums/module-path.enum';
import { PasswordChangeGuard } from './core/services/guards/password-change-guard.service';

const routes: Routes = [
    // Authentication Module routes
    {
        path: ModulePath.AuthenticationModule,
        loadChildren: './features/authentication/authentication.module#AuthenticationModule',
        resolve: {
            language: LanguageResolver
        }
    },

    // Routes for authenticated users
    {
        path: '',
        component: AuthenticatedComponent,
        resolve: {
            language: LanguageResolver
        },
        children: [
            // Account Module routes
            {
                path: ModulePath.AccountModule,
                loadChildren: './features/account/account.module#AccountModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ]
            },
            // User Module routes
            {
                path: ModulePath.UserModule,
                loadChildren: './features/user/user.module#UserModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: [PERMISSION.READ_USER_ACCOUNT]
                }
            },
            // User Role Module routes
            {
                path: ModulePath.UserRoleModule,
                loadChildren: './features/user-role/user-role.module#UserRoleModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: [PERMISSION.READ_ROLE]
                }
            },
            // Outbreak Module routes
            {
                path: ModulePath.OutbreakModule,
                loadChildren: './features/outbreak/outbreak.module#OutbreakModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: [PERMISSION.READ_OUTBREAK]
                }
            },
            // Contacts Module routes
            {
                path: ModulePath.ContactModule,
                loadChildren: './features/contact/contact.module#ContactModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: [PERMISSION.READ_CONTACT]
                }
            },
            // Case Module routes
            {
                path: ModulePath.CaseModule,
                loadChildren: './features/case/case.module#CaseModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: [PERMISSION.READ_CASE]
                }
            },
            // Event Module routes
            {
                path: ModulePath.EventModule,
                loadChildren: './features/event/event.module#EventModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: [PERMISSION.READ_EVENT]
                }
            },
            // Relationship Module routes
            {
                path: ModulePath.RelationshipModule,
                loadChildren: './features/relationship/relationship.module#RelationshipModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ]
            },
            // Reference Data Module routes
            {
                path: ModulePath.ReferenceDataModule,
                loadChildren: './features/reference-data/reference-data.module#ReferenceDataModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ]
            },
            // Locations Module routes
            {
                path: ModulePath.LocationModule,
                loadChildren: './features/location/location.module#LocationModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: [PERMISSION.READ_SYS_CONFIG]
                }
            },
            // Dashboard Module routes
            {
                path: ModulePath.DashboardModule,
                loadChildren: './features/dashboard/dashboard.module#DashboardModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ]
            },
            // Transmission Chain Module routes
            {
                path: ModulePath.TransmissionChainModule,
                loadChildren: './features/transmission-chain/transmission-chain.module#TransmissionChainModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ]
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
