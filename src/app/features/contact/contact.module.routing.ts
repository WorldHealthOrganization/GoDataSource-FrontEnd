import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/helper/auth-guard.service';

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
    // Modify Contact
    {
        path: ':contactId/modify',
        component: fromPages.ModifyContactComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_CONTACT]
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
    // Modify Follow Up
    {
        path: ':contactId/follow-ups/:followUpId/modify',
        component: fromPages.ModifyContactFollowUpComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_FOLLOWUP]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
