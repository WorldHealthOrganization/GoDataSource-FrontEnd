import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';

const routes: Routes = [
    // Backups
    {
        path: 'backups',
        component: fromPages.BackupsComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.BACKUP_LIST
            ]
        }
    },

    // Upstream Servers
    {
        path: 'upstream-servers',
        children: [
            {
                path: '',
                component: fromPages.UpstreamServersListComponent,
                canActivate: [AuthGuard],
                data: {
                    permissions: [
                        PERMISSION.UPSTREAM_SERVER_LIST
                    ]
                }
            },
            {
                path: 'create',
                component: fromPages.CreateUpstreamServerComponent,
                canActivate: [AuthGuard],
                data: {
                    permissions: [
                        PERMISSION.UPSTREAM_SERVER_CREATE
                    ]
                }
            }
        ]
    },

    // Client Applications
    {
        path: 'client-applications',
        children: [
            {
                path: '',
                component: fromPages.ClientApplicationsListComponent,
                canActivate: [AuthGuard],
                data: {
                    permissions: [
                        PERMISSION.CLIENT_APPLICATION_LIST
                    ]
                }
            },
            {
                path: 'create',
                component: fromPages.CreateClientApplicationComponent,
                canActivate: [AuthGuard],
                data: {
                    permissions: [
                        PERMISSION.CLIENT_APPLICATION_CREATE
                    ]
                }
            }
        ]
    },

    // System Devices
    {
        path: 'devices',
        children: [
            {
                path: '',
                component: fromPages.SystemDevicesComponent,
                canActivate: [AuthGuard],
                data: {
                    permissions: [
                        PERMISSION.DEVICE_LIST
                    ]
                }
            },
            {
                path: ':deviceId/view',
                component: fromPages.ModifySystemDeviceComponent,
                canActivate: [AuthGuard],
                data: {
                    permissions: [
                        PERMISSION.DEVICE_VIEW
                    ],
                    action: ViewModifyComponentAction.VIEW
                }
            },
            {
                path: ':deviceId/modify',
                component: fromPages.ModifySystemDeviceComponent,
                canActivate: [AuthGuard],
                data: {
                    permissions: [
                        PERMISSION.DEVICE_MODIFY
                    ],
                    action: ViewModifyComponentAction.MODIFY
                },
                canDeactivate: [
                    PageChangeConfirmationGuard
                ]
            },
            {
                path: ':deviceId/history',
                component: fromPages.ViewHistorySystemDeviceComponent,
                canActivate: [AuthGuard],
                data: {
                    permissions: [
                        PERMISSION.DEVICE_LIST_HISTORY
                    ]
                },
                canDeactivate: [
                    PageChangeConfirmationGuard
                ]
            }
        ]
    },

    // Sync
    {
        path: 'sync-logs',
        component: fromPages.SystemSyncLogsComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.SYNC_LOG_LIST
            ]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
