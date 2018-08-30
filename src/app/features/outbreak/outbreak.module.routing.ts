import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';

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
            permissions: [PERMISSION.WRITE_OUTBREAK]
        }
    },
    // View Outbreak
    {
        path: ':outbreakId/view',
        component: fromPages.ModifyOutbreakComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_OUTBREAK],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Edit Outbreak
    {
        path: ':outbreakId/modify',
        component: fromPages.ModifyOutbreakComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_OUTBREAK],
            action: ViewModifyComponentAction.MODIFY
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
