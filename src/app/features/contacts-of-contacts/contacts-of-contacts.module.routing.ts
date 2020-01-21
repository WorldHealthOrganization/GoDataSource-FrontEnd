import {RouterModule, Routes} from '@angular/router';

import * as fromPages from './pages';
import {ModuleWithProviders} from '@angular/core';
import {AuthGuard} from '../../core/services/guards/auth-guard.service';
import {PERMISSION} from '../../core/models/permission.model';
import {PageChangeConfirmationGuard} from '../../core/services/guards/page-change-confirmation-guard.service';
import {ViewModifyComponentAction} from '../../core/helperClasses/view-modify-component';

const routes: Routes = [
  // Contacts of contacts list
    {
        path: '',
        component: fromPages.ContactsOfContactsListComponent
    },
    // Create contact of contact
    {
        path: 'create',
        component: fromPages.CreateContactOfContactComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.CONTACT_CREATE]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View contact of contact
    {
        path: ':contactOfContactId/view',
        component: fromPages.ModifyContactOfContactComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CONTACT_VIEW
            ],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify contact of contact
    {
        path: ':contactOfContactId/modify',
        component: fromPages.ModifyContactOfContactComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CONTACT_MODIFY
            ],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);

