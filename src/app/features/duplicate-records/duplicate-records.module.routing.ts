import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
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
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
