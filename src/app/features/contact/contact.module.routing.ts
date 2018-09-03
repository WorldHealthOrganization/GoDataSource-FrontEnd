import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';

const routes: Routes = [
    // Contact list
    {
        path: '',
        component: fromPages.ContactsListComponent
    },
    // Create Contact
    {
        path: 'create',
        component: fromPages.CreateContactComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_CONTACT]
        }
    },
    // View Contact
    {
        path: ':contactId/view',
        component: fromPages.ModifyContactComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_CONTACT],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Contact
    {
        path: ':contactId/modify',
        component: fromPages.ModifyContactComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_CONTACT],
            action: ViewModifyComponentAction.MODIFY
        }
    },
    // View Contact movement
    {
        path: ':contactId/movement',
        component: fromPages.ViewMovementContactComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_CONTACT]
        }
    },
    // View Contact chronology
    {
        path: ':contactId/chronology',
        component: fromPages.ViewChronologyContactComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_CONTACT]
        }
    },
    // Follow-ups list
    {
        path: 'follow-ups',
        component: fromPages.ContactsFollowUpsListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_FOLLOWUP]
        }
    },
    // list of contacts that missed their last follow-up
    {
        path: 'follow-ups/missed',
        component: fromPages.ContactsFollowUpsMissedListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_FOLLOWUP]
        }
    },
    // Create Follow Up
    {
        path: ':contactId/follow-ups/create',
        component: fromPages.CreateContactFollowUpComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_FOLLOWUP]
        }
    },
    // View Follow Up
    {
        path: ':contactId/follow-ups/:followUpId/view',
        component: fromPages.ModifyContactFollowUpComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_FOLLOWUP],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Follow Up
    {
        path: ':contactId/follow-ups/:followUpId/modify',
        component: fromPages.ModifyContactFollowUpComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_FOLLOWUP],
            action: ViewModifyComponentAction.MODIFY
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
