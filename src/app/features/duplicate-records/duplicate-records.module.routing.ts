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
        component: fromPages.DuplicateRecordsListComponent
    },

    // Case - Merge
    {
        path: 'cases/merge',
        component: fromPages.CaseMergeDuplicateRecordsComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_CASE]
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
            permissions: [PERMISSION.WRITE_CONTACT]
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
            permissions: [PERMISSION.WRITE_EVENT]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
