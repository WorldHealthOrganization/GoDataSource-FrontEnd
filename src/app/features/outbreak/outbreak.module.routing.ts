import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/helper/auth-guard.service';
import { PERMISSION } from '../../core/models/user-role.model';

const routes: Routes = [
    // Outbreaks list
    {
        path: '',
        component: fromPages.OutbreakListComponent
    },
    // Create Outbreak
    {
        path: 'create',
        component: fromPages.CreateOutbreakComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_USER_ACCOUNT]
        }
    },
 //    Edit Outbreak
    {
        path: ':outbreakId/modify',
        component: fromPages.ModifyOutbreakComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_OUTBREAK]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
