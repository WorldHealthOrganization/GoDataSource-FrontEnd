import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { DashboardModel } from '../../core/models/dashboard.model';
import { ClassificationDataResolver } from '../../core/services/resolvers/data/classification.resolver';

const routes: Routes = [
  // Dashboard page
  {
    path: '',
    component: fromPages.DashboardComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: DashboardModel.canViewDashboard
    },
    resolve: {
      classification: ClassificationDataResolver
    }
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
