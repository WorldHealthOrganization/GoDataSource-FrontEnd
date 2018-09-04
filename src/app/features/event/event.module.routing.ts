import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';

import * as fromPages from './pages';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';

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
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View Event
    {
        path: ':eventId/view',
        component: fromPages.ModifyEventComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_EVENT],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Event
    {
        path: ':eventId/modify',
        component: fromPages.ModifyEventComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_EVENT],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
