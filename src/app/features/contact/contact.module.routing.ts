import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/helper/auth-guard.service';

const routes: Routes = [
    // Contact list
    {
        path: '',
        component: fromPages.ContactsListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_CONTACT]
        }
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
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
