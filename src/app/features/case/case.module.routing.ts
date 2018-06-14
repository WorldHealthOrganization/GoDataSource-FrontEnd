import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/helper/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';

const routes: Routes = [
    // Cases list
    {
        path: '',
        component: fromPages.CasesListComponent
    },
    // Create Case
    {
        path: 'create',
        component: fromPages.CreateCaseComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_CASE]
        }
    },
    // Edit Case
    {
        path: ':caseId/modify',
        component: fromPages.ModifyCaseComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_CASE]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
