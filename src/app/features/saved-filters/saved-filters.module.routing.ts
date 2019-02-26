import { RouterModule, Routes } from '@angular/router';
import { ModuleWithProviders } from '@angular/compiler/src/core';

import * as fromPages from './pages';

const routes: Routes = [
    {
        path: ``,
        component: fromPages.SavedFiltersComponent
    }
];

export const routing: ModuleWithProviders =  RouterModule.forChild(routes);
