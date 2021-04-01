import { RouterModule, Routes } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { ModuleWithProviders } from '@angular/core';

const routes: Routes = [
    {
        path: '',
        component: fromPages.CloudBackupComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.BACKUP_VIEW_CLOUD_BACKUP
            ]
        }
    }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
