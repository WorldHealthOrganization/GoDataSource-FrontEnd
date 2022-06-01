import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule, Route } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { LocationGeographicalLevelDataResolver } from '../../core/services/resolvers/data/location-geographical-level.resolver';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { LocationTreeDataResolver } from '../../core/services/resolvers/data/location-tree.resolver';

// common base - create / view / modify
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
    component: fromPages.CreateLocationComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.LOCATION_CREATE
      ]
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // Create Sub Level Location
  {
    path: ':parentId/create',
    component: fromPages.CreateLocationComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.LOCATION_CREATE
      ]
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Location
  {
    path: ':locationId/view',
    component: fromPages.ModifyLocationComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.LOCATION_VIEW
      ],
      action: ViewModifyComponentAction.VIEW
    }
  },
  // Modify Location
  {
    path: ':locationId/modify',
    component: fromPages.ModifyLocationComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.LOCATION_VIEW,
        PERMISSION.LOCATION_MODIFY
      ],
      action: ViewModifyComponentAction.MODIFY
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
    }
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
