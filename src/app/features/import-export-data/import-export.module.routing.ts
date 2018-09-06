import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';

import * as fromPages from './pages';

const routes: Routes = [
    // Import hierarchical locations
    {
        path: 'hierarchical-locations/import',
        component: fromPages.ImportHierarchicalLocationsComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_SYS_CONFIG]
        }
    },

    // Import case lab data locations
    {
        path: 'case-lab-data/import',
        component: fromPages.ImportCaseLabDataComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_CASE]
        }
    },

    // Import reference data
    {
        path: 'reference-data/import',
        component: fromPages.ImportReferenceDataComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_REFERENCE_DATA]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
