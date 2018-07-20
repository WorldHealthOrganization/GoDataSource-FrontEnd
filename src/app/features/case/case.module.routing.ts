import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/helper/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';

const routes: Routes = [
    // Cases list
    {
        path: '',
        component: fromPages.CasesListComponent
    },
    // Create Case
    {
        path: 'create',
        component: fromPages.CreateCaseComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_CASE]
        }
    },
    // Edit Case
    {
        path: ':caseId/modify',
        component: fromPages.ModifyCaseComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_CASE]
        }
    },

    // Lab results
    {
        path: ':caseId/lab-results',
        component: fromPages.CaseLabResultsListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_CASE]
        }
    },

    // Case Relationships list
    {
        path: ':caseId/relationships',
        component: fromPages.CaseRelationshipsListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_CASE]
        }
    },
    // Create Case Relationship
    {
        path: ':caseId/relationships/create',
        component: fromPages.CreateCaseRelationshipComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_CASE]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
