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
            // Saved Filters
            {
                path: ModulePath.SavedFiltersModule,
                loadChildren: './features/saved-filters/saved-filters.module#SavedFiltersModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: [PERMISSION.READ_SYS_CONFIG]
                }
            },
            // Cloud Backup Module routes
            {
                path: ModulePath.CloudBackupModule,
                loadChildren: './features/cloud-backup/cloud-backup.module#CloudBackupModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: [PERMISSION.READ_SYS_CONFIG]
                }
            },
            // Terms of use Module routes
            {
                path: ModulePath.TermsOfUseModule,
                loadChildren: './features/terms-of-use/terms-of-use.module#TermsOfUseModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: [PERMISSION.READ_SYS_CONFIG]
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
            // Outbreak Templates Module routes
            {
                path: ModulePath.OutbreakTemplatesModule,
                loadChildren: './features/outbreak-templates/outbreak-templates.module#OutbreakTemplatesModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: [PERMISSION.READ_SYS_CONFIG]
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
                    permissions: [
                        PERMISSION.READ_OUTBREAK,
                        PERMISSION.READ_CONTACT
                    ]
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
                    permissions: [
                        PERMISSION.READ_OUTBREAK,
                        PERMISSION.READ_CASE
                    ]
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
                    permissions: [
                        PERMISSION.READ_OUTBREAK,
                        PERMISSION.READ_EVENT
                    ]
                }
            },
            // Duplicate records routes
            {
                path: ModulePath.DuplicateRecordsModule,
                loadChildren: './features/duplicate-records/duplicate-records.module#DuplicateRecordsModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: [
                        PERMISSION.READ_OUTBREAK
                    ]
                }
            },
            // Cluster Module routes
            {
                path: ModulePath.ClusterModule,
                loadChildren: './features/cluster/cluster.module#ClusterModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: [PERMISSION.READ_OUTBREAK]
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
            // Teams Module routes
            {
                path: ModulePath.TeamModule,
                loadChildren: './features/team/team.module#TeamModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: [PERMISSION.READ_TEAM]
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
                ],
                data: {
                    permissions: [
                        PERMISSION.READ_OUTBREAK,
                        PERMISSION.READ_REPORT
                    ]
                }
            },
            // Import / Export Data Module routes
            {
                path: ModulePath.ImportExportDataModule,
                loadChildren: './features/import-export-data/import-export-data.module#ImportExportDataModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ]
            },
            // System settings Module routes
            {
                path: ModulePath.SystemConfigModule,
                loadChildren: './features/system-config/system-config.module#SystemConfigModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: [PERMISSION.READ_SYS_CONFIG]
                }
            },
            // Audit Logs Module routes
            {
                path: ModulePath.AuditLogModule,
                loadChildren: './features/audit-log/audit-log.module#AuditLogModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: [PERMISSION.READ_SYS_CONFIG]
                }
            },
            // Language Module routes
            {
                path: ModulePath.LanguageModule,
                loadChildren: './features/language/language.module#LanguageModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: [PERMISSION.READ_SYS_CONFIG]
                }
            },
            // Help Module routes
            {
                path: ModulePath.HelpModule,
                loadChildren: './features/help/help.module#HelpModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: [PERMISSION.WRITE_HELP]
                }
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
