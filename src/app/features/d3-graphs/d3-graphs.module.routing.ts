import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { DateRangeCenterDataResolver } from '../../core/services/resolvers/data/date-range-center.resolver';
import { ClassificationDataResolver } from '../../core/services/resolvers/data/classification.resolver';
import { OutcomeDataResolver } from '../../core/services/resolvers/data/outcome.resolver';

const routes: Routes = [
  {
    path: 'transmission-chain-bars',
    component: fromPages.TransmissionChainBarsComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.COT_VIEW_BAR_CHART
      ]
    },
    resolve: {
      dateRangeCenter: DateRangeCenterDataResolver,
      classification: ClassificationDataResolver,
      outcome: OutcomeDataResolver
    }
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
