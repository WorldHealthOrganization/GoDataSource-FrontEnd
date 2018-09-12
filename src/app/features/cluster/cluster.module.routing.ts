import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';

const routes: Routes = [
    // Clusters list
    {
        path: '',
        component: fromPages.ClustersListComponent
    },
    // Create Cluster
    {
        path: 'create',
        component: fromPages.CreateClusterComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_OUTBREAK]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View Cluster
    {
        path: ':clusterId/view',
        component: fromPages.ModifyClusterComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_OUTBREAK],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // View clusters people
    {
        path: ':clusterId/people',
        component: fromPages.ClustersPeopleListComponent,
        canActivate: [AuthGuard]
    },
    // Edit Cluster
    {
        path: ':clusterId/modify',
        component: fromPages.ModifyClusterComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_OUTBREAK],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
