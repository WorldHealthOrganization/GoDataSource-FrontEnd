import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule, Route } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { PermissionDataResolver } from '../../core/services/resolvers/data/permission.resolver';
import { RolesCreateViewModifyComponent } from './pages';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';

// common base - create / view / modify
const createViewModifyFoundation: Route = {
  component: RolesCreateViewModifyComponent,
  canActivate: [AuthGuard],
  resolve: {
    user: UserDataResolver,
    permission: PermissionDataResolver
  }
};

// routes
const routes: Routes = [
  // Roles list
  {
    path: '',
    component: fromPages.RolesListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.USER_ROLE_LIST
      ]
    },
    resolve: {
      yesNoAll: YesNoAllDataResolver,
      user: UserDataResolver,
      permission: PermissionDataResolver
    }
  },
  // Create new Role
  {
    path: 'create',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.USER_ROLE_CREATE
      ],
      action: CreateViewModifyV2Action.CREATE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Role
  {
    path: ':roleId/view',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.USER_ROLE_VIEW
      ],
      action: CreateViewModifyV2Action.VIEW
    }
  },
  // Modify Role
  {
    path: ':roleId/modify',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.USER_ROLE_MODIFY
      ],
      action: CreateViewModifyV2Action.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
