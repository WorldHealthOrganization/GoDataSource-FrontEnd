import {RouterModule, Routes} from '@angular/router';

import * as fromPages from './pages';
import {ModuleWithProviders} from '@angular/core';

const routes: Routes = [
  // Contacts of contacts list
    {
        path: '',
        component: fromPages.ContactsOfContactsListComponent
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);

