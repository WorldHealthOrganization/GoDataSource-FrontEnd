import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/helper/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';

const routes: Routes = [
    // Contact list
    {
        path: '',
        component: fromPages.ContactsListComponent
    }//,
    // // Create Contact
    // {
    //     path: 'create',
    //     // component: fromPages.CreateCaseComponent,
    //     canActivate: [AuthGuard],
    //     data: {
    //         permissions: [PERMISSION.WRITE_CONTACT]
    //     }
    // }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
