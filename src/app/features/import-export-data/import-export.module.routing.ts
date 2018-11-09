import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';

import * as fromPages from './pages';

const routes: Routes = [
    // Import locations
    {
        path: 'location-data/import',
        component: fromPages.ImportLocationDataComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_SYS_CONFIG]
        }
    },
    // Import hierarchical locations
    {
        path: 'hierarchical-locations/import',
        component: fromPages.ImportHierarchicalLocationsComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_SYS_CONFIG]
        }
    },

    // Import Language Tokens
    {
        path: 'language-data/:languageId/import-tokens',
        component: fromPages.ImportLanguageTokensComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_SYS_CONFIG]
        }
    },

    // Import reference data
    {
        path: 'reference-data/import',
        component: fromPages.ImportReferenceDataComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_REFERENCE_DATA]
        }
    },

    // Import case data
    {
        path: 'case-data/import',
        component: fromPages.ImportCaseDataComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_CASE]
        }
    },

    // Import case lab data
    {
        path: 'case-lab-data/import',
        component: fromPages.ImportCaseLabDataComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_CASE]
        }
    },

    // Import contact data
    {
        path: 'contact-data/import',
        component: fromPages.ImportContactDataComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_CONTACT]
        }
    },

    // Import outbreak data
    {
        path: 'outbreak-data/import',
        component: fromPages.ImportOutbreakDataComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_OUTBREAK]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
