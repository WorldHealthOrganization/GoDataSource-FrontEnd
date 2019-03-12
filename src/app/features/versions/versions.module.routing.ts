import { RouterModule, Routes } from '@angular/router';

import * as fromPages from './pages';
import { ModuleWithProviders } from '@angular/compiler/src/core';

const routes: Routes = [
    {
        path: '',
        component: fromPages.VersionsComponent
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
