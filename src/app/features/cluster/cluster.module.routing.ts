import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { GenderDataResolver } from '../../core/services/resolvers/data/gender.resolver';
import { RiskDataResolver } from '../../core/services/resolvers/data/risk.resolver';
import { PersonTypeDataResolver } from '../../core/services/resolvers/data/person-type.resolver';

const routes: Routes = [
  // Clusters list
  {
    path: '',
    component: fromPages.ClustersListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CLUSTER_LIST
      ]
    },
    resolve: {
      yesNoAll: YesNoAllDataResolver
    }
  },
  // Create Cluster
  {
    path: 'create',
    component: fromPages.CreateClusterComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CLUSTER_CREATE
      ]
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
      permissions: [
        PERMISSION.CLUSTER_VIEW
      ],
      action: ViewModifyComponentAction.VIEW
    }
  },
  // Edit Cluster
  {
    path: ':clusterId/modify',
    component: fromPages.ModifyClusterComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CLUSTER_VIEW,
        PERMISSION.CLUSTER_MODIFY
      ],
      action: ViewModifyComponentAction.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View clusters people
  {
    path: ':clusterId/people',
    component: fromPages.ClustersPeopleListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CLUSTER_LIST_PEOPLE
      ]
    },
    resolve: {
      yesNoAll: YesNoAllDataResolver,
      gender: GenderDataResolver,
      risk: RiskDataResolver,
      personType: PersonTypeDataResolver
    }
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
