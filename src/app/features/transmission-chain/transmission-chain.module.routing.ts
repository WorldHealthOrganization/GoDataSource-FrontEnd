import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';

const routes: Routes = [
    // Transmission Chains Graph
    {
        path: '',
        component: fromPages.TransmissionChainsGraphComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.READ_OUTBREAK,
                PERMISSION.READ_REPORT,
                PERMISSION.READ_CASE,
                PERMISSION.READ_CONTACT
            ]
        }
    },
    // Transmission Chains List
    {
        path: 'list',
        component: fromPages.TransmissionChainsListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.READ_OUTBREAK,
                PERMISSION.READ_REPORT,
                PERMISSION.READ_CASE,
                PERMISSION.READ_CONTACT
            ]
        }
    },
    // Transmission Chains Geospacially map
    {
        path: 'map',
        component: fromPages.TransmissionChainsGeoMapComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.READ_REPORT,
                PERMISSION.READ_CASE,
                PERMISSION.READ_CONTACT
            ]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
