import { RouterModule, Routes } from '@angular/router';
import * as fromPages from './pages';
import { ModuleWithProviders } from '@angular/compiler/src/core';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';

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

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
