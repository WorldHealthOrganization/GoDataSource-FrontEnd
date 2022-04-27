import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { TeamDataResolver } from '../../core/services/resolvers/data/team.resolver';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { InstitutionDataResolver } from '../../core/services/resolvers/data/institution.resolver';
import { UserRoleDataResolver } from '../../core/services/resolvers/data/user-role.resolver';
import { OutbreakDataResolver } from '../../core/services/resolvers/data/outbreak.resolver';

const routes: Routes = [
  // Users list
  {
    path: '',
    component: fromPages.UserListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.USER_LIST
      ]
    },
    resolve: {
      team: TeamDataResolver,
      yesNoAll: YesNoAllDataResolver,
      institution: InstitutionDataResolver,
      userRole: UserRoleDataResolver,
      outbreak: OutbreakDataResolver
    }
  },
  // Create User
  {
    path: 'create',
    component: fromPages.CreateUserComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.USER_CREATE
      ]
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View User
  {
    path: ':userId/view',
    component: fromPages.ModifyUserComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.USER_VIEW
      ],
      action: ViewModifyComponentAction.VIEW
    }
  },
  // Edit user
  {
    path: ':userId/modify',
    component: fromPages.ModifyUserComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.USER_MODIFY
      ],
      action: ViewModifyComponentAction.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View workload
  {
    path: 'workload',
    component: fromPages.UserWorkloadComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.USER_LIST_WORKLOAD
      ]
    }
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
