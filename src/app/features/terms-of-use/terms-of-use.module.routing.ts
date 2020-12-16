import { RouterModule, Routes } from '@angular/router';
import * as fromPages from './pages';
import { ModuleWithProviders } from '@angular/compiler/src/core';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';

const routes: Routes = [
    {
        path: '',
        component: fromPages.TermsOfUseComponent,
        canActivate: [AuthGuard]
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
