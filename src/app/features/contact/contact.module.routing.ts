import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';

const routes: Routes = [
    // Contact list
    {
        path: '',
        component: fromPages.ContactsListComponent
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
