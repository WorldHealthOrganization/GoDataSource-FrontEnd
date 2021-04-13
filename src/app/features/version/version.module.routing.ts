import { RouterModule, Routes } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { ModuleWithProviders } from '@angular/core';

const routes: Routes = [
    {
        path: '',
        component: fromPages.VersionComponent,
        canActivate: [AuthGuard]
    }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
