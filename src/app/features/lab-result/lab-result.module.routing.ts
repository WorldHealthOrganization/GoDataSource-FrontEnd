import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { EntityType } from '../../core/models/entity-type';
import { PERMISSION } from '../../core/models/permission.model';
import { PermissionExpression } from '../../core/models/user.model';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { ClassificationDataResolver } from '../../core/services/resolvers/data/classification.resolver';
import { LabNameDataResolver } from '../../core/services/resolvers/data/lab-name.resolver';
import { LabProgressDataResolver } from '../../core/services/resolvers/data/lab-progress.resolver';
import { LabSampleTypeDataResolver } from '../../core/services/resolvers/data/lab-sample-type.resolver';
import { LabSequenceLaboratoryDataResolver } from '../../core/services/resolvers/data/lab-sequence-laboratory.resolver';
import { LabSequenceResultDataResolver } from '../../core/services/resolvers/data/lab-sequence-result.resolver';
import { LabTestResultDataResolver } from '../../core/services/resolvers/data/lab-test-result.resolver';
import { LabTestTypeDataResolver } from '../../core/services/resolvers/data/lab-test-type.resolver';
import { PersonTypeDataResolver } from '../../core/services/resolvers/data/person-type.resolver';
import { PersonDataResolver } from '../../core/services/resolvers/data/person.resolver';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { YesNoDataResolver } from '../../core/services/resolvers/data/yes-no.resolver';
import * as fromPages from './pages';

// common base - cases lab results / contacts lab results
const entityLabResultsFoundation = {
  component: fromPages.EntityLabResultsListComponent,
  canActivate: [AuthGuard],
  resolve: {
    yesNoAll: YesNoAllDataResolver,
    labName: LabNameDataResolver,
    labSampleType: LabSampleTypeDataResolver,
    labTestType: LabTestTypeDataResolver,
    labTestResult: LabTestResultDataResolver,
    labResultProgress: LabProgressDataResolver,
    labSequenceLaboratory: LabSequenceLaboratoryDataResolver,
    labSequenceResult: LabSequenceResultDataResolver,
    user: UserDataResolver,
    yesNo: YesNoDataResolver,
    entityData: PersonDataResolver,
    classification: ClassificationDataResolver
  }
};

const routes: Routes = [
  // Outbreak Lab Results
  {
    path: '',
    component: fromPages.LabResultsListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.LAB_RESULT_LIST,
        new PermissionExpression({
          or: [
            PERMISSION.CASE_LIST_LAB_RESULT,
            PERMISSION.CONTACT_LIST_LAB_RESULT
          ]
        })
      ]
    },
    resolve: {
      yesNoAll: YesNoAllDataResolver,
      classification: ClassificationDataResolver,
      labName: LabNameDataResolver,
      labSampleType: LabSampleTypeDataResolver,
      labTestType: LabTestTypeDataResolver,
      labTestResult: LabTestResultDataResolver,
      labResultProgress: LabProgressDataResolver,
      labSequenceLaboratory: LabSequenceLaboratoryDataResolver,
      labSequenceResult: LabSequenceResultDataResolver,
      user: UserDataResolver,
      personType: PersonTypeDataResolver
    }
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
  },

  // Case Lab results
  {
    path: 'cases/:caseId',
    ...entityLabResultsFoundation,
    data: {
      permissions: [
        PERMISSION.CASE_LIST_LAB_RESULT
      ],
      personType: EntityType.CASE
    }
  },
  // Create Case Lab Result
  {
    path: 'cases/:caseId/create',
    component: fromPages.CreateLabResultComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CASE_CREATE_LAB_RESULT
      ],
      personType: EntityType.CASE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Case Lab Result
  {
    path: 'cases/:caseId/:labResultId/view',
    component: fromPages.ModifyLabResultComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CASE_VIEW_LAB_RESULT
      ],
      personType: EntityType.CASE,
      action: ViewModifyComponentAction.VIEW
    }
  },
  // Modify Case Lab Result
  {
    path: 'cases/:caseId/:labResultId/modify',
    component: fromPages.ModifyLabResultComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CASE_MODIFY_LAB_RESULT
      ],
      personType: EntityType.CASE,
      action: ViewModifyComponentAction.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },

  // Contact Lab results
  {
    path: 'contacts/:contactId',
    ...entityLabResultsFoundation,
    data: {
      permissions: [
        PERMISSION.CONTACT_LIST_LAB_RESULT
      ],
      personType: EntityType.CONTACT
    }
  },
  // Create Contact Lab Result
  {
    path: 'contacts/:contactId/create',
    component: fromPages.CreateLabResultComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CONTACT_CREATE_LAB_RESULT
      ],
      personType: EntityType.CONTACT
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Contact Lab Result
  {
    path: 'contacts/:contactId/:labResultId/view',
    component: fromPages.ModifyLabResultComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CONTACT_VIEW_LAB_RESULT
      ],
      personType: EntityType.CONTACT,
      action: ViewModifyComponentAction.VIEW
    }
  },
  // Modify Contact Lab Result
  {
    path: 'contacts/:contactId/:labResultId/modify',
    component: fromPages.ModifyLabResultComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CONTACT_MODIFY_LAB_RESULT
      ],
      personType: EntityType.CONTACT,
      action: ViewModifyComponentAction.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // Modify Questionnaire
  {
    path: ':labResultId/view-questionnaire',
    component: fromPages.ModifyQuestionnaireLabResultComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.LAB_RESULT_VIEW
      ],
      action: ViewModifyComponentAction.VIEW
    }
  },
  // Modify Questionnaire
  {
    path: ':labResultId/modify-questionnaire',
    component: fromPages.ModifyQuestionnaireLabResultComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.LAB_RESULT_MODIFY
      ],
      action: ViewModifyComponentAction.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
