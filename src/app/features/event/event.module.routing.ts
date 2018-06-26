import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../../core/services/helper/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';

import * as fromPages from './pages';

const routes: Routes = [
    // Events list
    {
        path: '',
        component: fromPages.EventsListComponent
    },
    // Create Event
    {
        path: 'create',
        component: fromPages.CreateEventComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_EVENT]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
