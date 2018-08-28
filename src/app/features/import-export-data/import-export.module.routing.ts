import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../../core/services/helper/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';

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
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
