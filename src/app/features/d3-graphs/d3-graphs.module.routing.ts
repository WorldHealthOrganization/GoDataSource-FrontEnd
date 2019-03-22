import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import * as fromPages from './pages';

const routes: Routes = [
    {
        path: 'transmission-chain-bars',
        component: fromPages.TransmissionChainBarsComponent
    },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
