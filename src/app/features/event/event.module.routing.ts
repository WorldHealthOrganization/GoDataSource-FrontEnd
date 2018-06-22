import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/helper/auth-guard.service';

const routes: Routes = [
    // Events list
    {
        path: '',
        component: fromPages.EventsListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_EVENT]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
