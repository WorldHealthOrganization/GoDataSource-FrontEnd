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
            permissions: [
                PERMISSION.LOCATION_IMPORT
            ]
        }
    },
    // Import hierarchical locations
    {
        path: 'hierarchical-locations/import',
        component: fromPages.ImportHierarchicalLocationsComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.LOCATION_IMPORT
            ]
        }
    },

    // Import Language Tokens
    {
        path: 'language-data/:languageId/import-tokens',
        component: fromPages.ImportLanguageTokensComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.LANGUAGE_IMPORT_TOKENS
            ]
        }
    },

    // Import reference data
    {
        path: 'reference-data/import',
        component: fromPages.ImportReferenceDataComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.REFERENCE_DATA_IMPORT
            ]
        }
    },

    // Import case data
    {
        path: 'case-data/import',
        component: fromPages.ImportCaseDataComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CASE_IMPORT
            ]
        }
    },

    // Import case lab data
    {
        path: 'case-lab-data/import',
        component: fromPages.ImportCaseLabDataComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CASE_IMPORT_LAB_RESULT
            ]
        }
    },

    // Import contact data
    {
        path: 'contact-data/import',
        component: fromPages.ImportContactDataComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CONTACT_IMPORT
            ]
        }
    },

    // Import contact of contact data
    {
      path: 'contact-of-contact-data/import',
        component: fromPages.ImportContactOfContactDataComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CONTACT_IMPORT
            ]
        }
    },

    // Import contact lab data
    {
        path: 'contact-lab-data/import',
        component: fromPages.ImportContactLabDataComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CONTACT_IMPORT_LAB_RESULT
            ]
        }
    },

    // Import sync package
    {
        path: 'sync-package/import',
        component: fromPages.ImportSyncPackageComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.SYNC_IMPORT_PACKAGE
            ]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
