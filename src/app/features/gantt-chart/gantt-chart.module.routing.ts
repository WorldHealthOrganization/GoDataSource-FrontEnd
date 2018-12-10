import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';

const routes: Routes = [
    // Gantt Chart
    {
        path: '',
        component: fromPages.GanttChartComponent
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
