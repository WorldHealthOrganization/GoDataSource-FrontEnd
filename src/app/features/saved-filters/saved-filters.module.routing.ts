import { RouterModule, Routes } from '@angular/router';
import { ModuleWithProviders } from '@angular/compiler/src/core';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';

const routes: Routes = [
    {
        path: '',
        component: fromPages.SavedFiltersComponent,
        canActivate: [AuthGuard]
    }
];

export const routing: ModuleWithProviders =  RouterModule.forChild(routes);
