import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { ClassificationDataResolver } from '../../core/services/resolvers/data/classification.resolver';
import { OutcomeDataResolver } from '../../core/services/resolvers/data/outcome.resolver';

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
    },
    resolve: {
      classification: ClassificationDataResolver,
      outcome: OutcomeDataResolver
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
  // Modify Case Questionnaire
  {
    path: ':caseId/view-questionnaire',
    component: fromPages.ModifyQuestionnaireCaseComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CASE_VIEW
      ],
      action: ViewModifyComponentAction.VIEW
    }
  },
  // Modify Case Questionnaire
  {
    path: ':caseId/modify-questionnaire',
    component: fromPages.ModifyQuestionnaireCaseComponent,
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
  // View Contact Questionnaire
  {
    path: ':caseId/history',
    component: fromPages.ModifyQuestionnaireCaseComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CASE_VIEW
      ],
      action: ViewModifyComponentAction.HISTORY
    }
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
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
