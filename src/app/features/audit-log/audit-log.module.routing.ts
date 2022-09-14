import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { UserRoleDataResolver } from '../../core/services/resolvers/data/user-role.resolver';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { AuditLogActionDataResolver } from '../../core/services/resolvers/data/audit-log-action.resolver';
import { AuditLogModuleDataResolver } from '../../core/services/resolvers/data/audit-log-module.resolver';

const routes: Routes = [
  // Audit Logs list
  {
    path: '',
    component: fromPages.AuditLogsListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.AUDIT_LOG_LIST
      ]
    },
    resolve: {
      yesNoAll: YesNoAllDataResolver,
      auditLogAction: AuditLogActionDataResolver,
      auditLogModule: AuditLogModuleDataResolver,
      user: UserDataResolver,
      userRole: UserRoleDataResolver
    }
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
