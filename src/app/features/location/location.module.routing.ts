import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/helper/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';

const routes: Routes = [
    // Locations list
    {
        path: '',
        component: fromPages.LocationsListComponent
    },
    // Location parent
    {
        path: ':parentId/children',
        component: fromPages.LocationsListComponent
    },
    // Create Top Level Location
    {
        path: 'create',
        component: fromPages.CreateLocationComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_SYS_CONFIG]
        }
    },
    // Create Sub Level Location
    {
        path: ':parentId/create',
        component: fromPages.CreateLocationComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_SYS_CONFIG]
        }
    },
    // View Location
    {
        path: ':locationId/view',
        component: fromPages.ModifyLocationComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_SYS_CONFIG],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Location
    {
        path: ':locationId/modify',
        component: fromPages.ModifyLocationComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_SYS_CONFIG],
            action: ViewModifyComponentAction.MODIFY
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
