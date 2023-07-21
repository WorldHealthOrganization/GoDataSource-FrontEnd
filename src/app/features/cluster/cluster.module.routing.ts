import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule, Route } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { GenderDataResolver } from '../../core/services/resolvers/data/gender.resolver';
import { RiskDataResolver } from '../../core/services/resolvers/data/risk.resolver';
import { PersonTypeDataResolver } from '../../core/services/resolvers/data/person-type.resolver';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { SelectedOutbreakDataResolver } from '../../core/services/resolvers/data/selected-outbreak.resolver';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { SelectedClusterDataResolver } from '../../core/services/resolvers/data/selected-cluster.resolver';

// create / view / modify
const createViewModifyFoundation: Route = {
  component: fromPages.ClusterCreateViewModifyComponent,
  canActivate: [AuthGuard],
  resolve: {
    user: UserDataResolver,
    outbreak: SelectedOutbreakDataResolver
  }
};

// routes
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
      yesNoAll: YesNoAllDataResolver,
      user: UserDataResolver
    }
  },
  // Create Cluster
  {
    path: 'create',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.CLUSTER_CREATE
      ],
      action: CreateViewModifyV2Action.CREATE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Cluster
  {
    path: ':clusterId/view',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.CLUSTER_VIEW
      ],
      action: CreateViewModifyV2Action.VIEW
    }
  },
  // Edit Cluster
  {
    path: ':clusterId/modify',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.CLUSTER_VIEW,
        PERMISSION.CLUSTER_MODIFY
      ],
      action: CreateViewModifyV2Action.MODIFY
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
      personType: PersonTypeDataResolver,
      selectedCluster: SelectedClusterDataResolver
    }
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
