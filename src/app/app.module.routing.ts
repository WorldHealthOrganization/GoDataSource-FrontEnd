import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/services/guards/auth-guard.service';
import { PERMISSION } from './core/models/permission.model';
import { AuthenticatedComponent } from './core/components/authenticated/authenticated.component';
import { ModulePath } from './core/enums/module-path.enum';
import { PasswordChangeGuard } from './core/services/guards/password-change-guard.service';
import { RedirectComponent } from './core/components/redirect/redirect.component';
import { PermissionExpression } from './core/models/user.model';
import { DashboardModel } from './core/models/dashboard.model';
import { LanguageUserResolver } from './core/services/resolvers/language-user.resolver';
import { NotAuthRedirectGuard } from './core/services/guards/not-auth-redirect-guard.service';

const routes: Routes = [
  // Authentication Module routes
  {
    path: ModulePath.AuthenticationModule,
    loadChildren: () => import('./features/authentication/authentication.module').then(m => m.AuthenticationModule),
    resolve: {
      language: LanguageUserResolver
    }
  },

  // Routes for authenticated users
  {
    path: '',
    component: AuthenticatedComponent,
    canActivate: [
      NotAuthRedirectGuard
    ],
    resolve: {
      language: LanguageUserResolver
    },
    children: [
      // Account Module routes
      {
        path: ModulePath.AccountModule,
        loadChildren: () => import('./features/account/account.module').then(m => m.AccountModule),
        canActivate: [
          AuthGuard,
          PasswordChangeGuard
        ]
      },
      // User Module routes
      {
        path: ModulePath.UserModule,
        loadChildren: () => import('./features/user/user.module').then(m => m.UserModule),
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
              PERMISSION.USER_MODIFY,
              PERMISSION.USER_LIST_WORKLOAD
            ]
          })
        }
      },
      // User Role Module routes
      {
        path: ModulePath.UserRoleModule,
        loadChildren: () => import('./features/user-role/user-role.module').then(m => m.UserRoleModule),
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
        loadChildren: () => import('./features/saved-filters/saved-filters.module').then(m => m.SavedFiltersModule),
        canActivate: [
          AuthGuard,
          PasswordChangeGuard
        ],
        data: {
          permissions: new PermissionExpression({
            or: [
              PERMISSION.SYSTEM_SETTINGS_MODIFY_SAVED_FILTERS,
              PERMISSION.SYSTEM_SETTINGS_DELETE_SAVED_FILTERS,
              PERMISSION.CASE_LIST,
              PERMISSION.FOLLOW_UP_LIST,
              PERMISSION.CONTACT_LIST,
              PERMISSION.CONTACT_OF_CONTACT_LIST,
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
        loadChildren: () => import('./features/cloud-backup/cloud-backup.module').then(m => m.CloudBackupModule),
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
        loadChildren: () => import('./features/saved-import-mapping/saved-import-mapping.module').then(m => m.SavedImportMappingModule),
        canActivate: [
          AuthGuard,
          PasswordChangeGuard
        ],
        data: {
          permissions: new PermissionExpression({
            or: [
              PERMISSION.SYSTEM_SETTINGS_MODIFY_SAVED_IMPORT,
              PERMISSION.SYSTEM_SETTINGS_DELETE_SAVED_IMPORT,
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
      // Outbreak Module routes
      {
        path: ModulePath.OutbreakModule,
        loadChildren: () => import('./features/outbreak/outbreak.module').then(m => m.OutbreakModule),
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
              PERMISSION.OUTBREAK_SEE_INCONSISTENCIES
            ]
          })
        }
      },
      // Outbreak Templates Module routes
      {
        path: ModulePath.OutbreakTemplatesModule,
        loadChildren: () => import('./features/outbreak-templates/outbreak-templates.module').then(m => m.OutbreakTemplatesModule),
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
              PERMISSION.OUTBREAK_TEMPLATE_MODIFY
            ]
          })
        }
      },
      // Contact Module routes
      {
        path: ModulePath.ContactModule,
        loadChildren: () => import('./features/contact/contact.module').then(m => m.ContactModule),
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
        loadChildren: () => import('./features/contacts-of-contacts/contacts-of-contacts.module').then(m => m.ContactsOfContactsModule),
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
                  PERMISSION.CONTACT_OF_CONTACT_VIEW_CHRONOLOGY_CHART
                ]
              })
            ]
          })
        }
      },
      // Case Module routes
      {
        path: ModulePath.CaseModule,
        loadChildren: () => import('./features/case/case.module').then(m => m.CaseModule),
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
        loadChildren: () => import('./features/event/event.module').then(m => m.EventModule),
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
        loadChildren: () => import('./features/lab-result/lab-result.module').then(m => m.LabResultModule),
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
        loadChildren: () => import('./features/duplicate-records/duplicate-records.module').then(m => m.DuplicateRecordsModule),
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
              PERMISSION.DUPLICATE_MERGE_CONTACTS_OF_CONTACTS,
              PERMISSION.DUPLICATE_MERGE_EVENTS,
              PERMISSION.CASE_LIST,
              PERMISSION.CONTACT_LIST,
              PERMISSION.CONTACT_OF_CONTACT_LIST
            ]
          })
        }
      },
      // Cluster Module routes
      {
        path: ModulePath.ClusterModule,
        loadChildren: () => import('./features/cluster/cluster.module').then(m => m.ClusterModule),
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
        loadChildren: () => import('./features/relationship/relationship.module').then(m => m.RelationshipModule),
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
        loadChildren: () => import('./features/reference-data/reference-data.module').then(m => m.ReferenceDataModule),
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
        loadChildren: () => import('./features/location/location.module').then(m => m.LocationModule),
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
        loadChildren: () => import('./features/team/team.module').then(m => m.TeamModule),
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
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
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
        loadChildren: () => import('./features/transmission-chain/transmission-chain.module').then(m => m.TransmissionChainModule),
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
        loadChildren: () => import('./features/d3-graphs/d3-graphs.module').then(m => m.D3GraphsModule),
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
        loadChildren: () => import('./features/import-export-data/import-export-data.module').then(m => m.ImportExportDataModule),
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
        loadChildren: () => import('./features/system-config/system-config.module').then(m => m.SystemConfigModule),
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
        loadChildren: () => import('./features/audit-log/audit-log.module').then(m => m.AuditLogModule),
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
        loadChildren: () => import('./features/language/language.module').then(m => m.LanguageModule),
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
        loadChildren: () => import('./features/help/help.module').then(m => m.HelpModule),
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

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' });
