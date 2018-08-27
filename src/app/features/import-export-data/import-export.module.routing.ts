import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../../core/services/helper/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';

import * as fromPages from './pages';

const routes: Routes = [
    // Import
    {
        path: ':type/import',
        component: fromPages.ImportDataComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_SYS_CONFIG]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
