import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';

const routes: Routes = [
    // Teams list
    {
        path: '',
        component: fromPages.TeamListComponent
    },
    // Create Team
    {
        path: 'create',
        component: fromPages.CreateTeamComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_TEAM]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View Team
    {
        path: ':teamId/view',
        component: fromPages.ModifyTeamComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_TEAM],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Edit team
    {
        path: ':teamId/modify',
        component: fromPages.ModifyTeamComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_TEAM],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View workload
    {
        path: 'workload',
        component: fromPages.TeamWorkloadComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_TEAM]
        }
    },

];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
