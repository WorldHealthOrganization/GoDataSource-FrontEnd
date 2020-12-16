import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';

const routes: Routes = [
    // Root locations list
    {
        path: '',
        component: fromPages.LocationsListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.LOCATION_LIST
            ]
        }
    },
    // Children locations list
    {
        path: ':parentId/children',
        component: fromPages.LocationsListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.LOCATION_LIST
            ]
        }
    },
    // Create Top Level Location
    {
        path: 'create',
        component: fromPages.CreateLocationComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.LOCATION_CREATE
            ]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // Create Sub Level Location
    {
        path: ':parentId/create',
        component: fromPages.CreateLocationComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.LOCATION_CREATE
            ]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View Location
    {
        path: ':locationId/view',
        component: fromPages.ModifyLocationComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.LOCATION_VIEW
            ],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Location
    {
        path: ':locationId/modify',
        component: fromPages.ModifyLocationComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.LOCATION_VIEW,
                PERMISSION.LOCATION_MODIFY
            ],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // Location Usage
    {
        path: ':locationId/usage',
        component: fromPages.LocationUsageListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.LOCATION_USAGE
            ]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
