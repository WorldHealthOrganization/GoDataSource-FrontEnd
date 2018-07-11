import * as fromPages from './pages';
import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/helper/auth-guard.service';

const routes: Routes = [
    // Follow-ups list
    {
        path: '',
        component: fromPages.FollowUpsListComponent
    },
    // Create Follow Up
    {
        path: 'create',
        component: fromPages.CreateFollowUpComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_FOLLOWUP]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
