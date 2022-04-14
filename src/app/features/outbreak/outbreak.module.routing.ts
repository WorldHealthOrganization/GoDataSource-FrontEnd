import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { OutbreakQestionnaireTypeEnum } from '../../core/enums/outbreak-qestionnaire-type.enum';
import { PermissionExpression } from '../../core/models/user.model';

const routes: Routes = [
  // Outbreaks list
  {
    path: '',
    component: fromPages.OutbreakListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_LIST
      ]
    }
  },
  // Create Outbreak
  {
    path: 'create',
    component: fromPages.CreateOutbreakComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        // list for checking if there is another outbreak with the same name
        PERMISSION.OUTBREAK_LIST,
        PERMISSION.OUTBREAK_CREATE
      ]
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Outbreak
  {
    path: ':outbreakId/view',
    component: fromPages.ModifyOutbreakComponent,
    // resolve: {
    //      outbreak: OutbreakResolver - the outbreak provided in url and not the selected one
    // },
    // return this.outbreakDataService.getOutbreak(
    //   route.paramMap.get('outbreakId'),
    //   true
    // );
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW
      ],
      action: ViewModifyComponentAction.VIEW
    }
  },
  // Edit Outbreak
  {
    path: ':outbreakId/modify',
    component: fromPages.ModifyOutbreakComponent,
    // resolve: {
    //   outbreak: OutbreakResolver - the outbreak provided in url and not the selected one
    // },
    // return this.outbreakDataService.getOutbreak(
    //   route.paramMap.get('outbreakId'),
    //   true
    // );
    canActivate: [AuthGuard],
    data: {
      permissions: [
        // list for checking if there is another outbreak with the same name
        PERMISSION.OUTBREAK_LIST,
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.OUTBREAK_MODIFY
      ],
      action: ViewModifyComponentAction.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },

  // Edit Outbreak Case Questionnaire
  {
    path: ':outbreakId/case-questionnaire',
    component: fromPages.OutbreakQuestionnaireComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.OUTBREAK_MODIFY,
        PERMISSION.OUTBREAK_MODIFY_CASE_QUESTIONNAIRE
      ],
      questionnaire: OutbreakQestionnaireTypeEnum.CASE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },

  // Edit Outbreak Contact Questionnaire
  {
    path: ':outbreakId/contact-questionnaire',
    component: fromPages.OutbreakQuestionnaireComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.OUTBREAK_MODIFY,
        PERMISSION.OUTBREAK_MODIFY_CONTACT_QUESTIONNAIRE
      ],
      questionnaire: OutbreakQestionnaireTypeEnum.CONTACT
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },

  // Edit Outbreak Contact Follow-up Questionnaire
  {
    path: ':outbreakId/contact-follow-up-questionnaire',
    component: fromPages.OutbreakQuestionnaireComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.OUTBREAK_MODIFY,
        PERMISSION.OUTBREAK_MODIFY_CONTACT_FOLLOW_UP_QUESTIONNAIRE
      ],
      questionnaire: OutbreakQestionnaireTypeEnum.FOLLOW_UP
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },

  // Edit Outbreak Case Lab Results Questionnaire
  {
    path: ':outbreakId/case-lab-results-questionnaire',
    component: fromPages.OutbreakQuestionnaireComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.OUTBREAK_MODIFY,
        PERMISSION.OUTBREAK_MODIFY_CASE_LAB_RESULT_QUESTIONNAIRE
      ],
      questionnaire: OutbreakQestionnaireTypeEnum.CASE_LAB_RESULT
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },

  // Inconsistencies
  {
    path: ':outbreakId/inconsistencies',
    component: fromPages.InconsistenciesListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_SEE_INCONSISTENCIES
      ]
    }
  },

  // Global entity search result
  {
    path: ':outbreakId/search-results',
    component: fromPages.SearchResultListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: new PermissionExpression({
        or: [
          PERMISSION.CASE_LIST,
          PERMISSION.CONTACT_LIST,
          PERMISSION.CONTACT_OF_CONTACT_LIST,
          PERMISSION.EVENT_LIST
        ]
      })
    }
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
