import { ModuleWithProviders } from '@angular/core';
import { Route, RouterModule, Routes } from '@angular/router';
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
import { PersonDataResolver } from '../../core/services/resolvers/data/person.resolver';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { YesNoDataResolver } from '../../core/services/resolvers/data/yes-no.resolver';
import * as fromPages from './pages';
import { LabPersonTypeDataResolver } from '../../core/services/resolvers/data/lab-person-type.resolver';
import { GanttChartTypeDataResolver } from '../../core/services/resolvers/data/gantt-chart-type.resolver';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { SelectedOutbreakDataResolver } from '../../core/services/resolvers/data/selected-outbreak.resolver';
import { RelationshipPersonDataResolver } from '../../core/services/resolvers/data/relationship-person.resolver';

// common base - create / view / modify
const createViewModifyFoundation: Route = {
  component: fromPages.LabResultsCreateViewModifyComponent,
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
    outbreak: SelectedOutbreakDataResolver
  }
};

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
      labPersonType: LabPersonTypeDataResolver
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
    },
    resolve: {
      ganttChartType: GanttChartTypeDataResolver
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
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.CASE_CREATE_LAB_RESULT
      ],
      personType: EntityType.CASE,
      action: CreateViewModifyV2Action.CREATE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Case Lab Result
  {
    path: 'cases/:caseId/:labResultId/view',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.CASE_VIEW_LAB_RESULT
      ],
      personType: EntityType.CASE,
      action: CreateViewModifyV2Action.VIEW
    }
  },
  // Modify Case Lab Result
  {
    path: 'cases/:caseId/:labResultId/modify',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.CASE_MODIFY_LAB_RESULT
      ],
      personType: EntityType.CASE,
      action: CreateViewModifyV2Action.MODIFY
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
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.CONTACT_CREATE_LAB_RESULT
      ],
      personType: EntityType.CONTACT,
      action: CreateViewModifyV2Action.CREATE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Contact Lab Result
  {
    path: 'contacts/:contactId/:labResultId/view',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.CONTACT_VIEW_LAB_RESULT
      ],
      personType: EntityType.CONTACT,
      action: CreateViewModifyV2Action.VIEW
    }
  },
  // Modify Contact Lab Result
  {
    path: 'contacts/:contactId/:labResultId/modify',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.CONTACT_MODIFY_LAB_RESULT
      ],
      personType: EntityType.CONTACT,
      action: CreateViewModifyV2Action.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // Modify list of Lab Results
  {
    path: 'modify-list',
    component: fromPages.LabResultsBulkModifyComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.LAB_RESULT_BULK_MODIFY
      ],
      action: CreateViewModifyV2Action.MODIFY
    },
    resolve: {
      outbreak: SelectedOutbreakDataResolver,
      entity: RelationshipPersonDataResolver,
      labName: LabNameDataResolver,
      labTestResult: LabTestResultDataResolver,
      labResultProgress: LabProgressDataResolver,
      labSequenceLaboratory: LabSequenceLaboratoryDataResolver,
      labSequenceResult: LabSequenceResultDataResolver
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
