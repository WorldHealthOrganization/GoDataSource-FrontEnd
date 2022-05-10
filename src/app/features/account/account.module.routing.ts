import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { UserRoleDataResolver } from '../../core/services/resolvers/data/user-role.resolver';
import { OutbreakDataResolver } from '../../core/services/resolvers/data/outbreak.resolver';

// routes
const routes: Routes = [
  {
    path: 'change-password',
    component: fromPages.ChangePasswordComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.USER_MODIFY_OWN_ACCOUNT
      ]
    }
  },
  {
    path: 'set-security-questions',
    component: fromPages.SetSecurityQuestionsComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.USER_MODIFY_OWN_ACCOUNT
      ]
    }
  },
  {
    path: 'my-profile',
    component: fromPages.MyProfileComponent,
    canActivate: [AuthGuard],
    resolve: {
      userRole: UserRoleDataResolver,
      outbreak: OutbreakDataResolver
    },
    data: {
      action: CreateViewModifyV2Action.VIEW
    }
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
