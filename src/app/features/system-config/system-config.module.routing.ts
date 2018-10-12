import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';

const routes: Routes = [
    {
        path: '',
        component: fromPages.SystemConfigComponent
    },

    // Sync upstream servers
    {
        path: 'system-upstream-sync',
        component: fromPages.SystemUpstreamSyncComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_SYS_CONFIG]
        }
    },
    // Create System Upstream server
    {
        path: 'system-upstream-sync/create',
        component: fromPages.CreateSystemUpstreamSyncComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_SYS_CONFIG]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },

    // Client applications
    {
        path: 'system-client-applications',
        component: fromPages.SystemClientApplicationsComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_SYS_CONFIG]
        }
    },
    // Create System Client application
    {
        path: 'system-client-applications/create',
        component: fromPages.CreateSystemClientApplicationComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_SYS_CONFIG]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
