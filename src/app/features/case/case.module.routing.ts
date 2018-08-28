import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';

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
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View Case
    {
        path: ':caseId/view',
        component: fromPages.ModifyCaseComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_CASE],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Case
    {
        path: ':caseId/modify',
        component: fromPages.ModifyCaseComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_CASE],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View Case movement
    {
        path: ':caseId/movement',
        component: fromPages.ViewMovementCaseComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_CASE]
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
    // Create Case Lab Result
    {
        path: ':caseId/lab-results/create',
        component: fromPages.CreateCaseLabResultComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_CASE]
        }
    },
    // View Case Lab Result
    {
        path: ':caseId/lab-results/:labResultId/view',
        component: fromPages.ModifyCaseLabResultComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_CASE],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Case Lab Result
    {
        path: ':caseId/lab-results/:labResultId/modify',
        component: fromPages.ModifyCaseLabResultComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_CASE],
            action: ViewModifyComponentAction.MODIFY
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
