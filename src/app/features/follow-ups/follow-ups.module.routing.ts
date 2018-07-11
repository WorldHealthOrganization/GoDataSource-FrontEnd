import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';

const routes: Routes = [
    // Follow-ups list
    {
        path: '',
        component: fromPages.FollowUpsListComponent
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
