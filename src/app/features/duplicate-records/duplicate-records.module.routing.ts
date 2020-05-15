import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import * as fromPages from './pages';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';

const routes: Routes = [
    // Duplicate records list
    {
        path: '',
        component: fromPages.DuplicateRecordsListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.DUPLICATE_LIST]
        }
    },

    // Case - Merge
    {
        path: 'cases/merge',
        component: fromPages.CaseMergeDuplicateRecordsComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.DUPLICATE_MERGE_CASES
            ]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },

    // Contact - Merge
    {
        path: 'contacts/merge',
        component: fromPages.ContactMergeDuplicateRecordsComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.DUPLICATE_MERGE_CONTACTS
            ]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },

    // Contact of contact - Merge
    {
        path: 'contacts-of-contacts/merge',
        component: fromPages.ContactMergeDuplicateRecordsComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.DUPLICATE_MERGE_CONTACTS_OF_CONTACTS
            ]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },

    // Event - Merge
    {
        path: 'events/merge',
        component: fromPages.EventMergeDuplicateRecordsComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.DUPLICATE_MERGE_EVENTS
            ]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },

    // Not Duplicates List - Cases
    {
        path: 'cases/:caseId/marked-not-duplicates',
        component: fromPages.MarkedNotDuplicatesListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CASE_LIST
            ]
        }
    },
    // Not Duplicates List - Contacts
    {
        path: 'contacts/:contactId/marked-not-duplicates',
        component: fromPages.MarkedNotDuplicatesListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CONTACT_LIST
            ]
        }
    },
    // Not Duplicates List - Contacts of Contacts
    {
        path: 'contacts-of-contacts/:contactOfContactId/marked-not-duplicates',
        component: fromPages.MarkedNotDuplicatesListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CONTACT_OF_CONTACT_LIST
            ]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
