import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule, Route } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { LocationGeographicalLevelDataResolver } from '../../core/services/resolvers/data/location-geographical-level.resolver';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { LocationTreeDataResolver } from '../../core/services/resolvers/data/location-tree.resolver';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { OutbreakDataResolver } from '../../core/services/resolvers/data/outbreak.resolver';

// common base - create / view / modify
const locationCreateViewModifyFoundation: Route = {
  component: fromPages.LocationsCreateViewModifyComponent,
  canActivate: [AuthGuard],
  resolve: {
    parentLocationTree: LocationTreeDataResolver,
    geographicalLevel: LocationGeographicalLevelDataResolver,
    user: UserDataResolver
  }
};

// common base
const locationFoundation: Route = {
  component: fromPages.LocationsListComponent,
  canActivate: [AuthGuard],
  resolve: {
    yesNoAll: YesNoAllDataResolver,
    geographicalLevel: LocationGeographicalLevelDataResolver,
    user: UserDataResolver,
    parentLocationTree: LocationTreeDataResolver
  }
};

// routes
const routes: Routes = [
  // Root locations list
  {
    path: '',
    ...locationFoundation,
    data: {
      permissions: [
        PERMISSION.LOCATION_LIST
      ]
    }
  },
  // Children locations list
  {
    path: ':parentId/children',
    ...locationFoundation,
    data: {
      permissions: [
        PERMISSION.LOCATION_LIST
      ]
    }
  },
  // Create Top Level Location
  {
    path: 'create',
    ...locationCreateViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.LOCATION_CREATE
      ],
      action: CreateViewModifyV2Action.CREATE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // Create Sub Level Location
  {
    path: ':parentId/create',
    ...locationCreateViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.LOCATION_CREATE
      ],
      action: CreateViewModifyV2Action.CREATE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Location
  {
    path: ':locationId/view',
    ...locationCreateViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.LOCATION_VIEW
      ],
      action: CreateViewModifyV2Action.VIEW
    }
  },
  // Modify Location
  {
    path: ':locationId/modify',
    ...locationCreateViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.LOCATION_VIEW,
        PERMISSION.LOCATION_MODIFY
      ],
      action: CreateViewModifyV2Action.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // Location Usage
  {
    path: ':locationId/usage',
    component: fromPages.LocationUsageListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.LOCATION_USAGE
      ]
    },
    resolve: {
      parentLocationTree: LocationTreeDataResolver,
      yesNoAll: YesNoAllDataResolver,
      outbreak: OutbreakDataResolver
    }
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
