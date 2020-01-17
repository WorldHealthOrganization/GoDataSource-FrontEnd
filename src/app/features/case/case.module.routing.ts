import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { PermissionExpression } from '../../core/models/user.model';

const routes: Routes = [
    // Cases list
    {
        path: '',
        component: fromPages.CasesListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CASE_LIST
            ]
        }
    },
    // Create Case
    {
        path: 'create',
        component: fromPages.CreateCaseComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CASE_CREATE
            ]
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
            permissions: [
                PERMISSION.CASE_VIEW
            ],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Case
    {
        path: ':caseId/modify',
        component: fromPages.ModifyCaseComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CASE_MODIFY
            ],
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
            permissions: [
                PERMISSION.CASE_VIEW_MOVEMENT_MAP
            ]
        }
    },
    // View Case Chronology
    {
        path: ':caseId/chronology',
        component: fromPages.ViewChronologyCaseComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CASE_VIEW_CHRONOLOGY_CHART
            ]
        }
    },
    // Outbreak Lab Results
    {
        path: 'lab-results',
        component: fromPages.LabResultsListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CASE_LIST_LAB_RESULT
            ]
        }
    },
    // Case Lab results
    {
        path: ':caseId/lab-results',
        component: fromPages.CaseLabResultsListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CASE_LIST_LAB_RESULT
            ]
        }
    },
    // Create Case Lab Result
    {
        path: ':caseId/lab-results/create',
        component: fromPages.CreateCaseLabResultComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CASE_CREATE_LAB_RESULT
            ]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View Case Lab Result
    {
        path: ':caseId/lab-results/:labResultId/view',
        component: fromPages.ModifyCaseLabResultComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CASE_VIEW_LAB_RESULT
            ],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Case Lab Result
    {
        path: ':caseId/lab-results/:labResultId/modify',
        component: fromPages.ModifyCaseLabResultComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CASE_MODIFY_LAB_RESULT
            ],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View Gantt Chart
    {
        path: 'gantt-chart',
        component: fromPages.GanttChartComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: new PermissionExpression({
                or: [
                    PERMISSION.GANTT_CHART_VIEW_DELAY_ONSET_LAB_TESTING,
                    PERMISSION.GANTT_CHART_VIEW_DELAY_ONSET_HOSPITALIZATION
                ]
            })
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
