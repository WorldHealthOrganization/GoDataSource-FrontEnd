import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';

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
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
