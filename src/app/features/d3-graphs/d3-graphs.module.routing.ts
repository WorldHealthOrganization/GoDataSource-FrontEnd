import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';

const routes: Routes = [
    {
        path: 'transmission-chain-bars',
        component: fromPages.TransmissionChainBarsComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.COT_VIEW_BAR_CHART
            ]
        }
    },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
