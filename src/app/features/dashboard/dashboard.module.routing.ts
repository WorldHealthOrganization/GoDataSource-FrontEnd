import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { DashboardModel } from '../../core/models/dashboard.model';

const routes: Routes = [
    // Dashboard page
    {
        path: '',
        component: fromPages.DashboardComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: DashboardModel.canViewDashboard
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
