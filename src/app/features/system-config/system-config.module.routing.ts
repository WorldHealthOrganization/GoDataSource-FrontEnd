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
        component: fromPages.BackupsComponent
    },
    // Upstream Servers
    {
        path: 'upstream-servers',
        children: [
            {
                path: '',
                component: fromPages.UpstreamServersListComponent
            },
            {
                path: 'create',
                component: fromPages.CreateUpstreamServerComponent
            }
        ]
    },
    // Client Applications
    {
        path: 'client-applications',
        children: [
            {
                path: '',
                component: fromPages.ClientApplicationsListComponent
            },
            {
                path: 'create',
                component: fromPages.CreateClientApplicationComponent
            }
        ]
    },
    // System Devices
    {
        path: 'devices',
        children: [
            {
                path: '',
                component: fromPages.SystemDevicesComponent
            },
            {
                path: ':deviceId/modify',
                component: fromPages.ModifySystemDeviceComponent,
                canActivate: [AuthGuard],
                data: {
                    permissions: [PERMISSION.WRITE_SYS_CONFIG],
                    action: ViewModifyComponentAction.MODIFY
                },
                canDeactivate: [
                    PageChangeConfirmationGuard
                ]
            },
            {
                path: ':deviceId/history',
                component: fromPages.ViewHistorySystemDeviceComponent,
                canDeactivate: [
                    PageChangeConfirmationGuard
                ]
            }
        ]
    },
    // Sync
    {
        path: 'sync-logs',
        component: fromPages.SystemSyncLogsComponent
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
