import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule, Route } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { TeamDataResolver } from '../../core/services/resolvers/data/team.resolver';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { InstitutionDataResolver } from '../../core/services/resolvers/data/institution.resolver';
import { UserRoleDataResolver } from '../../core/services/resolvers/data/user-role.resolver';
import { OutbreakDataResolver } from '../../core/services/resolvers/data/outbreak.resolver';
import { UserCreateViewModifyComponent } from './pages';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { LanguageDataResolver } from '../../core/services/resolvers/data/language.resolver';
import { YesNoDataResolver } from '../../core/services/resolvers/data/yes-no.resolver';

// common base - create / view / modify
const createViewModifyFoundation: Route = {
  component: UserCreateViewModifyComponent,
  canActivate: [AuthGuard],
  resolve: {
    institution: InstitutionDataResolver,
    userRole: UserRoleDataResolver,
    outbreak: OutbreakDataResolver,
    team: TeamDataResolver,
    user: UserDataResolver,
    language: LanguageDataResolver,
    yesNo: YesNoDataResolver
  }
};

// routes
const routes: Routes = [
  // Users list
  {
    path: '',
    component: fromPages.UserListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.USER_LIST
      ],
      outbreakIncludeDeleted: true
    },
    resolve: {
      team: TeamDataResolver,
      yesNoAll: YesNoAllDataResolver,
      yesNo: YesNoDataResolver,
      institution: InstitutionDataResolver,
      userRole: UserRoleDataResolver,
      outbreak: OutbreakDataResolver,
      language: LanguageDataResolver
    }
  },
  // Create User
  {
    path: 'create',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.USER_CREATE
      ],
      action: CreateViewModifyV2Action.CREATE,
      outbreakIncludeDeleted: true
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View User
  {
    path: ':userId/view',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.USER_VIEW
      ],
      action: CreateViewModifyV2Action.VIEW,
      outbreakIncludeDeleted: true
    }
  },
  // Edit user
  {
    path: ':userId/modify',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.USER_MODIFY
      ],
      action: CreateViewModifyV2Action.MODIFY,
      outbreakIncludeDeleted: true
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
    },
    resolve: {
      yesNoAll: YesNoAllDataResolver,
      user: UserDataResolver
    }
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
