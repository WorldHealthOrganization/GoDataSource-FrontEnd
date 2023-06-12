import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule, Route } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { ClassificationDataResolver } from '../../core/services/resolvers/data/classification.resolver';
import { OutcomeDataResolver } from '../../core/services/resolvers/data/outcome.resolver';
import { GenderDataResolver } from '../../core/services/resolvers/data/gender.resolver';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { OccupationDataResolver } from '../../core/services/resolvers/data/occupation.resolver';
import { RiskDataResolver } from '../../core/services/resolvers/data/risk.resolver';
import { YesNoDataResolver } from '../../core/services/resolvers/data/yes-no.resolver';
import { PregnancyStatusDataResolver } from '../../core/services/resolvers/data/pregnancy-status.resolver';
import { VaccineDataResolver } from '../../core/services/resolvers/data/vaccine.resolver';
import { VaccineStatusDataResolver } from '../../core/services/resolvers/data/vaccine-status.resolver';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { SelectedOutbreakDataResolver } from '../../core/services/resolvers/data/selected-outbreak.resolver';
import { DocumentTypeDataResolver } from '../../core/services/resolvers/data/document-type.resolver';
import { AddressTypeDataResolver } from '../../core/services/resolvers/data/address-type.resolver';
import { PersonDateTypeDataResolver } from '../../core/services/resolvers/data/person-date-type.resolver';
import { DateRangeCenterDataResolver } from '../../core/services/resolvers/data/date-range-center.resolver';
import { PersonTypeDataResolver } from '../../core/services/resolvers/data/person-type.resolver';
import { ClusterDataResolver } from '../../core/services/resolvers/data/cluster.resolver';
import { CertaintyLevelDataResolver } from '../../core/services/resolvers/data/certainty-level.resolver';
import { ExposureTypeDataResolver } from '../../core/services/resolvers/data/exposure-type.resolver';
import { ExposureFrequencyDataResolver } from '../../core/services/resolvers/data/exposure-frequency.resolver';
import { ExposureDurationDataResolver } from '../../core/services/resolvers/data/exposure-duration.resolver';
import { ContextOfTransmissionDataResolver } from '../../core/services/resolvers/data/context-of-transmission.resolver';
import { LabNameDataResolver } from '../../core/services/resolvers/data/lab-name.resolver';
import { LabSampleTypeDataResolver } from '../../core/services/resolvers/data/lab-sample-type.resolver';
import { LabTestTypeDataResolver } from '../../core/services/resolvers/data/lab-test-type.resolver';
import { LabTestResultDataResolver } from '../../core/services/resolvers/data/lab-test-result.resolver';
import { LabProgressDataResolver } from '../../core/services/resolvers/data/lab-progress.resolver';
import { LabSequenceLaboratoryDataResolver } from '../../core/services/resolvers/data/lab-sequence-laboratory.resolver';
import { LabSequenceResultDataResolver } from '../../core/services/resolvers/data/lab-sequence-result.resolver';
import { TeamDataResolver } from '../../core/services/resolvers/data/team.resolver';
import { DailyFollowUpStatusDataResolver } from '../../core/services/resolvers/data/daily-follow-up-status.resolver';
import { InvestigationStatusDataResolver } from '../../core/services/resolvers/data/investigation-status.resolver';

// common base - create / view / modify
const createViewModifyFoundation: Route = {
  component: fromPages.CasesCreateViewModifyComponent,
  canActivate: [AuthGuard],
  resolve: {
    outbreak: SelectedOutbreakDataResolver,
    gender: GenderDataResolver,
    pregnancy: PregnancyStatusDataResolver,
    documentType: DocumentTypeDataResolver,
    classification: ClassificationDataResolver,
    occupation: OccupationDataResolver,
    user: UserDataResolver,
    addressType: AddressTypeDataResolver,
    outcome: OutcomeDataResolver,
    risk: RiskDataResolver,
    vaccine: VaccineDataResolver,
    vaccineStatus: VaccineStatusDataResolver,
    dateRangeType: PersonDateTypeDataResolver,
    dateRangeCenter: DateRangeCenterDataResolver,
    yesNo: YesNoDataResolver,
    personType: PersonTypeDataResolver,
    cluster: ClusterDataResolver,
    certaintyLevel: CertaintyLevelDataResolver,
    exposureType: ExposureTypeDataResolver,
    exposureFrequency: ExposureFrequencyDataResolver,
    exposureDuration: ExposureDurationDataResolver,
    contextOfTransmission: ContextOfTransmissionDataResolver,
    yesNoAll: YesNoAllDataResolver,
    labName: LabNameDataResolver,
    labSampleType: LabSampleTypeDataResolver,
    labTestType: LabTestTypeDataResolver,
    labTestResult: LabTestResultDataResolver,
    labResultProgress: LabProgressDataResolver,
    labSequenceLaboratory: LabSequenceLaboratoryDataResolver,
    labSequenceResult: LabSequenceResultDataResolver,
    team: TeamDataResolver,
    dailyFollowUpStatus: DailyFollowUpStatusDataResolver,
    investigationStatus: InvestigationStatusDataResolver
  }
};

// routes
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
      gender: GenderDataResolver,
      occupation: OccupationDataResolver,
      outcome: OutcomeDataResolver,
      pregnancy: PregnancyStatusDataResolver,
      risk: RiskDataResolver,
      yesNoAll: YesNoAllDataResolver,
      yesNo: YesNoDataResolver,
      user: UserDataResolver,
      vaccine: VaccineDataResolver,
      vaccineStatus: VaccineStatusDataResolver,
      investigationStatus: InvestigationStatusDataResolver,
      documentType: DocumentTypeDataResolver
    }
  },
  // Create Case
  {
    path: 'create',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.CASE_CREATE
      ],
      action: CreateViewModifyV2Action.CREATE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Case
  {
    path: ':caseId/view',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.CASE_VIEW
      ],
      action: CreateViewModifyV2Action.VIEW
    }
  },
  // Modify Case
  {
    path: ':caseId/modify',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.CASE_MODIFY
      ],
      action: CreateViewModifyV2Action.MODIFY
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
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
