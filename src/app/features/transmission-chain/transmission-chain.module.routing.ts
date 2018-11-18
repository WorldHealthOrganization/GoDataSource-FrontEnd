import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import * as fromPages from './pages';
import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';

const routes: Routes = [
    // Transmission Chains Graph
    {
        path: '',
        component: fromPages.TransmissionChainsGraphComponent
    },
    // Transmission Chains List
    {
        path: 'list',
        component: fromPages.TransmissionChainsListComponent
    },
    // Transmission Chains Geospacially map
    {
        path: 'map',
        component: fromPages.TransmissionChainsGeoMapComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.READ_CASE
            ]
        }
    },
    // Case Count Map
    {
        path: 'case-count-map',
        component: fromPages.CaseCountMapComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.READ_CASE
            ]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
