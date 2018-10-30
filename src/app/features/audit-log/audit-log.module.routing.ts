import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';

const routes: Routes = [
    // Audit Logs list
    {
        path: '',
        component: fromPages.AuditLogsListComponent
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
