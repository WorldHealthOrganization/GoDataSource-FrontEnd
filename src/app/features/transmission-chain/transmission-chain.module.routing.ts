import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import * as fromPages from './pages';
import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PermissionExpression } from '../../core/models/user.model';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { ClassificationDataResolver } from '../../core/services/resolvers/data/classification.resolver';
import { OccupationDataResolver } from '../../core/services/resolvers/data/occupation.resolver';
import { OutcomeDataResolver } from '../../core/services/resolvers/data/outcome.resolver';
import { GenderDataResolver } from '../../core/services/resolvers/data/gender.resolver';
import { ClusterDataResolver } from '../../core/services/resolvers/data/cluster.resolver';

const routes: Routes = [
  // Transmission Chains Graph
  {
    path: '',
    component: fromPages.TransmissionChainsGraphComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: new PermissionExpression({
        or: [
          PERMISSION.COT_VIEW_BUBBLE_NETWORK,
          PERMISSION.COT_VIEW_GEOSPATIAL_MAP,
          PERMISSION.COT_VIEW_HIERARCHICAL_NETWORK,
          PERMISSION.COT_VIEW_TIMELINE_NETWORK_DATE_OF_ONSET,
          PERMISSION.COT_VIEW_TIMELINE_NETWORK_DATE_OF_LAST_CONTACT,
          PERMISSION.COT_VIEW_TIMELINE_NETWORK_DATE_OF_REPORTING
        ]
      })
    },
    resolve: {
      classification: ClassificationDataResolver,
      occupation: OccupationDataResolver,
      outcome: OutcomeDataResolver,
      gender: GenderDataResolver,
      cluster: ClusterDataResolver
    }
  },
  // Transmission Chains List
  {
    path: 'list',
    component: fromPages.TransmissionChainsListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.COT_LIST
      ]
    },
    resolve: {
      yesNoAll: YesNoAllDataResolver
    }
  },
  // Case Count Map
  {
    path: 'case-count-map',
    component: fromPages.CaseCountMapComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.COT_VIEW_CASE_COUNT_MAP
      ]
    }
  },

  // Snapshots list page
  {
    path: 'snapshots',
    component: fromPages.TransmissionChainsSnapshotListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.COT_LIST
      ]
    }
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
