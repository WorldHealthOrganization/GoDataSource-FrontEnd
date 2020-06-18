import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/services/guards/auth-guard.service';
import { PERMISSION } from './core/models/permission.model';
import { AuthenticatedComponent } from './core/components/authenticated/authenticated.component';
import { LanguageResolver } from './core/services/resolvers/language.resolver';
import { ModulePath } from './core/enums/module-path.enum';
import { PasswordChangeGuard } from './core/services/guards/password-change-guard.service';
import { RedirectComponent } from './core/components/redirect/redirect.component';
import { PermissionExpression } from './core/models/user.model';
import { DashboardModel } from './core/models/dashboard.model';

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
                ],
                data: {
                    permissions: [
                        PERMISSION.USER_MODIFY_OWN_ACCOUNT
                    ]
                }
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
                    permissions: new PermissionExpression({
                        or: [
                            PERMISSION.USER_LIST,
                            PERMISSION.USER_CREATE,
                            PERMISSION.USER_VIEW,
                            PERMISSION.USER_MODIFY
                        ]
                    })
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
                    permissions: new PermissionExpression({
                        or: [
                            PERMISSION.USER_ROLE_LIST,
                            PERMISSION.USER_ROLE_CREATE,
                            PERMISSION.USER_ROLE_VIEW,
                            PERMISSION.USER_ROLE_MODIFY
                        ]
                    })
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
                    permissions: new PermissionExpression({
                        or: [
                            PERMISSION.CASE_LIST,
                            PERMISSION.FOLLOW_UP_LIST,
                            PERMISSION.CONTACT_LIST,
                            PERMISSION.CASE_LIST_LAB_RESULT,
                            PERMISSION.CONTACT_LIST_LAB_RESULT,
                            PERMISSION.LAB_RESULT_LIST,
                            PERMISSION.CASE_CHANGE_SOURCE_RELATIONSHIP,
                            PERMISSION.CONTACT_CHANGE_SOURCE_RELATIONSHIP,
                            PERMISSION.EVENT_CHANGE_SOURCE_RELATIONSHIP,
                            PERMISSION.RELATIONSHIP_CREATE,
                            PERMISSION.RELATIONSHIP_SHARE
                        ]
                    })
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
                    permissions: [
                        PERMISSION.BACKUP_VIEW_CLOUD_BACKUP
                    ]
                }
            },
            // Saved Import Mapping Module routes
            {
                path: ModulePath.SavedImportMappingModule,
                loadChildren: './features/saved-import-mapping/saved-import-mapping.module#SavedImportMappingModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: new PermissionExpression({
                        or: [
                            PERMISSION.LOCATION_IMPORT,
                            PERMISSION.REFERENCE_DATA_IMPORT,
                            PERMISSION.CONTACT_IMPORT,
                            PERMISSION.CONTACT_IMPORT_LAB_RESULT,
                            PERMISSION.CASE_IMPORT,
                            PERMISSION.CASE_IMPORT_LAB_RESULT,
                            PERMISSION.OUTBREAK_IMPORT_RELATIONSHIP,
                            PERMISSION.CONTACT_OF_CONTACT_IMPORT
                        ]
                    })
                }
            },
            // Terms of use Module routes
            {
                path: ModulePath.TermsOfUseModule,
                loadChildren: './features/terms-of-use/terms-of-use.module#TermsOfUseModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ]
            },
            // Version
            {
                path: ModulePath.VersionModule,
                loadChildren: './features/version/version.module#VersionModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ]
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
                    permissions: new PermissionExpression({
                        or: [
                            PERMISSION.OUTBREAK_LIST,
                            PERMISSION.OUTBREAK_VIEW,
                            PERMISSION.OUTBREAK_CREATE,
                            PERMISSION.OUTBREAK_MODIFY,
                            PERMISSION.OUTBREAK_SEE_INCONSISTENCIES,
                            PERMISSION.OUTBREAK_MODIFY_CASE_QUESTIONNAIRE,
                            PERMISSION.OUTBREAK_MODIFY_CONTACT_FOLLOW_UP_QUESTIONNAIRE,
                            PERMISSION.OUTBREAK_MODIFY_CASE_LAB_RESULT_QUESTIONNAIRE
                        ]
                    })
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
                    permissions: new PermissionExpression({
                        or: [
                            PERMISSION.OUTBREAK_TEMPLATE_LIST,
                            PERMISSION.OUTBREAK_TEMPLATE_VIEW,
                            PERMISSION.OUTBREAK_TEMPLATE_CREATE,
                            PERMISSION.OUTBREAK_TEMPLATE_MODIFY,
                            PERMISSION.OUTBREAK_TEMPLATE_MODIFY_CASE_QUESTIONNAIRE,
                            PERMISSION.OUTBREAK_TEMPLATE_MODIFY_CONTACT_FOLLOW_UP_QUESTIONNAIRE,
                            PERMISSION.OUTBREAK_TEMPLATE_MODIFY_CASE_LAB_RESULT_QUESTIONNAIRE
                        ]
                    })
                }
            },
            // Contact Module routes
            {
                path: ModulePath.ContactModule,
                loadChildren: './features/contact/contact.module#ContactModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: new PermissionExpression({
                        and: [
                            PERMISSION.OUTBREAK_VIEW,
                            new PermissionExpression({
                                or: [
                                    PERMISSION.CONTACT_LIST,
                                    PERMISSION.CONTACT_CREATE,
                                    PERMISSION.CONTACT_VIEW,
                                    PERMISSION.CONTACT_MODIFY,
                                    PERMISSION.CONTACT_BULK_CREATE,
                                    PERMISSION.CONTACT_BULK_MODIFY,
                                    PERMISSION.CONTACT_VIEW_MOVEMENT_MAP,
                                    PERMISSION.CONTACT_VIEW_CHRONOLOGY_CHART,
                                    PERMISSION.FOLLOW_UP_LIST,
                                    PERMISSION.FOLLOW_UP_LIST_RANGE,
                                    PERMISSION.FOLLOW_UP_CREATE,
                                    PERMISSION.FOLLOW_UP_VIEW,
                                    PERMISSION.FOLLOW_UP_MODIFY,
                                    PERMISSION.FOLLOW_UP_BULK_MODIFY
                                ]
                            })
                        ]
                    })
                }
            },
            // Contacts of contacts Module routes
            {
                path: ModulePath.ContactsOfContactsModule,
                loadChildren: './features/contacts-of-contacts/contacts-of-contacts.module#ContactsOfContactsModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: new PermissionExpression({
                        and: [
                            PERMISSION.OUTBREAK_VIEW,
                            new PermissionExpression({
                                or: [
                                    PERMISSION.CONTACT_OF_CONTACT_LIST,
                                    PERMISSION.CONTACT_OF_CONTACT_CREATE,
                                    PERMISSION.CONTACT_OF_CONTACT_VIEW,
                                    PERMISSION.CONTACT_OF_CONTACT_MODIFY,
                                    PERMISSION.CONTACT_OF_CONTACT_BULK_CREATE,
                                    PERMISSION.CONTACT_OF_CONTACT_BULK_MODIFY,
                                    PERMISSION.CONTACT_OF_CONTACT_VIEW_MOVEMENT_MAP,
                                    PERMISSION.CONTACT_OF_CONTACT_VIEW_CHRONOLOGY_CHART,
                                ]
                            })
                        ]
                    })
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
                    permissions: new PermissionExpression({
                        and: [
                            PERMISSION.OUTBREAK_VIEW,
                            new PermissionExpression({
                                or: [
                                    PERMISSION.CASE_LIST,
                                    PERMISSION.CASE_CREATE,
                                    PERMISSION.CASE_VIEW,
                                    PERMISSION.CASE_MODIFY,
                                    PERMISSION.CASE_VIEW_MOVEMENT_MAP,
                                    PERMISSION.CASE_VIEW_CHRONOLOGY_CHART
                                ]
                            })
                        ]
                    })
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
                    permissions: new PermissionExpression({
                        and: [
                            PERMISSION.OUTBREAK_VIEW,
                            new PermissionExpression({
                                or: [
                                    PERMISSION.EVENT_LIST,
                                    PERMISSION.EVENT_VIEW,
                                    PERMISSION.EVENT_CREATE,
                                    PERMISSION.EVENT_MODIFY
                                ]
                            })
                        ]
                    })
                }
            },
            // Lab Result Module routes
            {
                path: ModulePath.LabResultModule,
                loadChildren: './features/lab-result/lab-result.module#LabResultModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: new PermissionExpression({
                        and: [
                            PERMISSION.OUTBREAK_VIEW,
                            new PermissionExpression({
                                or: [
                                    PERMISSION.LAB_RESULT_LIST,
                                    PERMISSION.GANTT_CHART_VIEW_DELAY_ONSET_LAB_TESTING,
                                    PERMISSION.GANTT_CHART_VIEW_DELAY_ONSET_HOSPITALIZATION,
                                    PERMISSION.CASE_LIST_LAB_RESULT,
                                    PERMISSION.CASE_CREATE_LAB_RESULT,
                                    PERMISSION.CASE_VIEW_LAB_RESULT,
                                    PERMISSION.CASE_MODIFY_LAB_RESULT,
                                    PERMISSION.CONTACT_LIST_LAB_RESULT,
                                    PERMISSION.CONTACT_CREATE_LAB_RESULT,
                                    PERMISSION.CONTACT_VIEW_LAB_RESULT,
                                    PERMISSION.CONTACT_MODIFY_LAB_RESULT
                                ]
                            })
                        ]
                    })
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
                    permissions: new PermissionExpression({
                        or: [
                            PERMISSION.DUPLICATE_LIST,
                            PERMISSION.DUPLICATE_MERGE_CASES,
                            PERMISSION.DUPLICATE_MERGE_CONTACTS,
                            PERMISSION.DUPLICATE_MERGE_EVENTS,
                            PERMISSION.CASE_LIST,
                            PERMISSION.CONTACT_LIST
                        ]
                    })
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
                    permissions: new PermissionExpression({
                        or: [
                            PERMISSION.CLUSTER_LIST,
                            PERMISSION.CLUSTER_VIEW,
                            PERMISSION.CLUSTER_CREATE,
                            PERMISSION.CLUSTER_MODIFY,
                            PERMISSION.CLUSTER_LIST_PEOPLE
                        ]
                    })
                }
            },
            // Relationship Module routes
            {
                path: ModulePath.RelationshipModule,
                loadChildren: './features/relationship/relationship.module#RelationshipModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: new PermissionExpression({
                        and: [
                            PERMISSION.OUTBREAK_VIEW,
                            new PermissionExpression({
                                or: [
                                    PERMISSION.RELATIONSHIP_LIST,
                                    PERMISSION.RELATIONSHIP_VIEW,
                                    PERMISSION.RELATIONSHIP_CREATE,
                                    PERMISSION.RELATIONSHIP_MODIFY,
                                    PERMISSION.RELATIONSHIP_SHARE,
                                    PERMISSION.CASE_LIST_ONSET_BEFORE_PRIMARY_CASE_REPORT,
                                    PERMISSION.CASE_LIST_LONG_PERIOD_BETWEEN_DATES_REPORT,
                                    new PermissionExpression({
                                        or: [
                                            PERMISSION.CASE_CHANGE_SOURCE_RELATIONSHIP,
                                            PERMISSION.CONTACT_CHANGE_SOURCE_RELATIONSHIP,
                                            PERMISSION.EVENT_CHANGE_SOURCE_RELATIONSHIP
                                        ]
                                    })
                                ]
                            })
                        ]
                    })
                }
            },
            // Reference Data Module routes
            {
                path: ModulePath.ReferenceDataModule,
                loadChildren: './features/reference-data/reference-data.module#ReferenceDataModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: new PermissionExpression({
                        or: [
                            PERMISSION.REFERENCE_DATA_LIST,
                            PERMISSION.REFERENCE_DATA_CATEGORY_ITEM_LIST,
                            PERMISSION.REFERENCE_DATA_CATEGORY_ITEM_CREATE,
                            PERMISSION.REFERENCE_DATA_CATEGORY_ITEM_VIEW,
                            PERMISSION.REFERENCE_DATA_CATEGORY_ITEM_MODIFY,
                            PERMISSION.ICON_LIST,
                            PERMISSION.ICON_CREATE
                        ]
                    })
                }
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
                    permissions: new PermissionExpression({
                        or: [
                            PERMISSION.LOCATION_LIST,
                            PERMISSION.LOCATION_CREATE,
                            PERMISSION.LOCATION_VIEW,
                            PERMISSION.LOCATION_MODIFY,
                            PERMISSION.LOCATION_USAGE
                        ]
                    })
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
                    permissions: new PermissionExpression({
                        or: [
                            PERMISSION.TEAM_LIST,
                            PERMISSION.TEAM_CREATE,
                            PERMISSION.TEAM_VIEW,
                            PERMISSION.TEAM_MODIFY,
                            PERMISSION.TEAM_LIST_WORKLOAD
                        ]
                    })
                }
            },
            // Dashboard Module routes
            {
                path: ModulePath.DashboardModule,
                loadChildren: './features/dashboard/dashboard.module#DashboardModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: DashboardModel.canViewDashboard
                }
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
                    permissions: new PermissionExpression({
                        or: [
                            PERMISSION.COT_VIEW_BUBBLE_NETWORK,
                            PERMISSION.COT_VIEW_GEOSPATIAL_MAP,
                            PERMISSION.COT_VIEW_HIERARCHICAL_NETWORK,
                            PERMISSION.COT_VIEW_TIMELINE_NETWORK_DATE_OF_ONSET,
                            PERMISSION.COT_VIEW_TIMELINE_NETWORK_DATE_OF_LAST_CONTACT,
                            PERMISSION.COT_VIEW_TIMELINE_NETWORK_DATE_OF_REPORTING,
                            PERMISSION.COT_LIST,
                            PERMISSION.COT_VIEW_CASE_COUNT_MAP
                        ]
                    })
                }
            },
            // D3 Graphs Module routes
            {
                path: ModulePath.D3GraphsModule,
                loadChildren: './features/d3-graphs/d3-graphs.module#D3GraphsModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ],
                data: {
                    permissions: [
                        PERMISSION.COT_VIEW_BAR_CHART
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
                ],
                data: {
                    permissions: new PermissionExpression({
                        or: [
                            PERMISSION.LOCATION_IMPORT,
                            PERMISSION.LANGUAGE_IMPORT_TOKENS,
                            PERMISSION.SYNC_IMPORT_PACKAGE,
                            PERMISSION.REFERENCE_DATA_IMPORT,
                            PERMISSION.CONTACT_IMPORT,
                            PERMISSION.CONTACT_IMPORT_LAB_RESULT,
                            PERMISSION.CASE_IMPORT,
                            PERMISSION.CASE_IMPORT_LAB_RESULT,
                            PERMISSION.OUTBREAK_IMPORT_RELATIONSHIP,
                            PERMISSION.CONTACT_OF_CONTACT_IMPORT
                        ]
                    })
                }
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
                    permissions: new PermissionExpression({
                        or: [
                            PERMISSION.BACKUP_LIST,
                            PERMISSION.SYNC_LOG_LIST,
                            PERMISSION.DEVICE_LIST,
                            PERMISSION.DEVICE_VIEW,
                            PERMISSION.DEVICE_MODIFY,
                            PERMISSION.DEVICE_LIST_HISTORY,
                            PERMISSION.UPSTREAM_SERVER_LIST,
                            PERMISSION.UPSTREAM_SERVER_CREATE,
                            PERMISSION.CLIENT_APPLICATION_LIST,
                            PERMISSION.CLIENT_APPLICATION_CREATE
                        ]
                    })
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
                    permissions: [
                        PERMISSION.AUDIT_LOG_LIST
                    ]
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
                    permissions: new PermissionExpression({
                        or: [
                            PERMISSION.LANGUAGE_LIST,
                            PERMISSION.LANGUAGE_CREATE,
                            PERMISSION.LANGUAGE_VIEW,
                            PERMISSION.LANGUAGE_MODIFY
                        ]
                    })
                }
            },
            // Help Module routes
            {
                path: ModulePath.HelpModule,
                loadChildren: './features/help/help.module#HelpModule',
                canActivate: [
                    AuthGuard,
                    PasswordChangeGuard
                ]
                // NO permissions required, only to be authenticated
            },

            // Redirect Module routes
            // hack for coming back to the same page since angular doesn't permit this and this creates a couple of issues
            {
                path: ModulePath.RedirectModule,
                component: RedirectComponent
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
