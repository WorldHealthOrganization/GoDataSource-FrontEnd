import { TeamDataResolver } from './../../core/services/resolvers/data/team.resolver';
import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule, Route } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { TeamCreateViewModifyComponent } from './pages/team-create-view-modify/team-create-view-modify.component';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';

// common base - create / view / modify
const createViewModifyFoundation: Route = {
  component: TeamCreateViewModifyComponent,
  canActivate: [AuthGuard],
  resolve: {
    user: UserDataResolver
  }
};

const routes: Routes = [
  // Teams list
  {
    path: '',
    component: fromPages.TeamListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.TEAM_LIST
      ]
    },
    resolve: {
      user: UserDataResolver,
      yesNoAll: YesNoAllDataResolver
    }
  },
  // Create Team
  {
    path: 'create',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.TEAM_CREATE
      ],
      action: CreateViewModifyV2Action.CREATE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Team
  {
    path: ':teamId/view',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.TEAM_VIEW
      ],
      action: CreateViewModifyV2Action.VIEW
    }
  },
  // Edit team
  {
    path: ':teamId/modify',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.TEAM_MODIFY
      ],
      action: CreateViewModifyV2Action.MODIFY
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
      permissions: [
        PERMISSION.TEAM_LIST_WORKLOAD
      ]
    },
    resolve: {
      yesNoAll: YesNoAllDataResolver,
      team: TeamDataResolver
    }
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
