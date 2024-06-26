import { ModuleWithProviders } from '@angular/core';
import { Route, RouterModule, Routes } from '@angular/router';
import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { GenderDataResolver } from '../../core/services/resolvers/data/gender.resolver';
import { OccupationDataResolver } from '../../core/services/resolvers/data/occupation.resolver';
import { RiskDataResolver } from '../../core/services/resolvers/data/risk.resolver';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import * as fromPages from './pages';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { PregnancyStatusDataResolver } from '../../core/services/resolvers/data/pregnancy-status.resolver';
import { DocumentTypeDataResolver } from '../../core/services/resolvers/data/document-type.resolver';
import { AddressTypeDataResolver } from '../../core/services/resolvers/data/address-type.resolver';
import { VaccineDataResolver } from '../../core/services/resolvers/data/vaccine.resolver';
import { VaccineStatusDataResolver } from '../../core/services/resolvers/data/vaccine-status.resolver';
import { PersonTypeDataResolver } from '../../core/services/resolvers/data/person-type.resolver';
import { ClusterDataResolver } from '../../core/services/resolvers/data/cluster.resolver';
import { CertaintyLevelDataResolver } from '../../core/services/resolvers/data/certainty-level.resolver';
import { ExposureTypeDataResolver } from '../../core/services/resolvers/data/exposure-type.resolver';
import { ExposureFrequencyDataResolver } from '../../core/services/resolvers/data/exposure-frequency.resolver';
import { ExposureDurationDataResolver } from '../../core/services/resolvers/data/exposure-duration.resolver';
import { ContextOfTransmissionDataResolver } from '../../core/services/resolvers/data/context-of-transmission.resolver';
import { SelectedOutbreakDataResolver } from '../../core/services/resolvers/data/selected-outbreak.resolver';
import { RelationshipPersonDataResolver } from '../../core/services/resolvers/data/relationship-person.resolver';
import { YesNoDataResolver } from '../../core/services/resolvers/data/yes-no.resolver';
import { TeamDataResolver } from '../../core/services/resolvers/data/team.resolver';
import { DailyFollowUpStatusDataResolver } from '../../core/services/resolvers/data/daily-follow-up-status.resolver';
import { LabNameDataResolver } from '../../core/services/resolvers/data/lab-name.resolver';
import { LabSampleTypeDataResolver } from '../../core/services/resolvers/data/lab-sample-type.resolver';
import { LabTestTypeDataResolver } from '../../core/services/resolvers/data/lab-test-type.resolver';
import { LabTestResultDataResolver } from '../../core/services/resolvers/data/lab-test-result.resolver';
import { LabProgressDataResolver } from '../../core/services/resolvers/data/lab-progress.resolver';
import { LabSequenceLaboratoryDataResolver } from '../../core/services/resolvers/data/lab-sequence-laboratory.resolver';
import { LabSequenceResultDataResolver } from '../../core/services/resolvers/data/lab-sequence-result.resolver';
import { CreatedOnResolver } from '../../core/services/resolvers/data/created-on.resolver';
import { DeletedUserDataResolver } from '../../core/services/resolvers/data/deleted-user.resolver';
import { FollowUpCreatedAsDataResolver } from '../../core/services/resolvers/data/follow-up-created-as.resolver';

// common base - create / view / modify
const createViewModifyFoundation: Route = {
  component: fromPages.ContactsOfContactsCreateViewModifyComponent,
  canActivate: [AuthGuard],
  resolve: {
    createdOn: CreatedOnResolver,
    outbreak: SelectedOutbreakDataResolver,
    gender: GenderDataResolver,
    pregnancy: PregnancyStatusDataResolver,
    occupation: OccupationDataResolver,
    user: UserDataResolver,
    deletedUser: DeletedUserDataResolver,
    documentType: DocumentTypeDataResolver,
    addressType: AddressTypeDataResolver,
    risk: RiskDataResolver,
    vaccine: VaccineDataResolver,
    vaccineStatus: VaccineStatusDataResolver,
    personType: PersonTypeDataResolver,
    cluster: ClusterDataResolver,
    certaintyLevel: CertaintyLevelDataResolver,
    exposureType: ExposureTypeDataResolver,
    exposureFrequency: ExposureFrequencyDataResolver,
    exposureDuration: ExposureDurationDataResolver,
    contextOfTransmission: ContextOfTransmissionDataResolver,
    yesNoAll: YesNoAllDataResolver,
    yesNo: YesNoDataResolver,
    labName: LabNameDataResolver,
    labSampleType: LabSampleTypeDataResolver,
    labTestType: LabTestTypeDataResolver,
    labTestResult: LabTestResultDataResolver,
    labResultProgress: LabProgressDataResolver,
    labSequenceLaboratory: LabSequenceLaboratoryDataResolver,
    labSequenceResult: LabSequenceResultDataResolver,
    entity: RelationshipPersonDataResolver,
    team: TeamDataResolver,
    dailyFollowUpStatus: DailyFollowUpStatusDataResolver,
    followUpCreatedAs: FollowUpCreatedAsDataResolver
  }
};

// routes
const routes: Routes = [
  // Contacts of contacts list
  {
    path: '',
    component: fromPages.ContactsOfContactsListComponent,
    resolve: {
      createdOn: CreatedOnResolver,
      risk: RiskDataResolver,
      user: UserDataResolver,
      gender: GenderDataResolver,
      yesNoAll: YesNoAllDataResolver,
      yesNo: YesNoDataResolver,
      occupation: OccupationDataResolver,
      pregnancy: PregnancyStatusDataResolver,
      documentType: DocumentTypeDataResolver,
      addressType: AddressTypeDataResolver,
      vaccine: VaccineDataResolver,
      vaccineStatus: VaccineStatusDataResolver
    }
  },
  // Create contact of contact
  {
    path: 'create',
    ...createViewModifyFoundation,
    data: {
      permissions: [PERMISSION.CONTACT_OF_CONTACT_CREATE],
      action: CreateViewModifyV2Action.CREATE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View contact of contact
  {
    path: ':contactOfContactId/view',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.CONTACT_OF_CONTACT_VIEW
      ],
      action: CreateViewModifyV2Action.VIEW
    }
  },
  // Modify contact of contact
  {
    path: ':contactOfContactId/modify',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.CONTACT_OF_CONTACT_MODIFY
      ],
      action: CreateViewModifyV2Action.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // Bulk Add Contacts of Contacts
  {
    path: 'create-bulk',
    component: fromPages.ContactsOfContactsBulkCreateModifyComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CONTACT_OF_CONTACT_BULK_CREATE
      ],
      action: CreateViewModifyV2Action.CREATE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ],
    resolve: {
      entity: RelationshipPersonDataResolver,
      gender: GenderDataResolver,
      pregnancyStatus: PregnancyStatusDataResolver,
      occupation: OccupationDataResolver,
      documentType: DocumentTypeDataResolver,
      yesNo: YesNoDataResolver,
      risk: RiskDataResolver,
      certaintyLevel: CertaintyLevelDataResolver,
      exposureType: ExposureTypeDataResolver,
      exposureFrequency: ExposureFrequencyDataResolver,
      exposureDuration: ExposureDurationDataResolver,
      contextOfTransmission: ContextOfTransmissionDataResolver,
      cluster: ClusterDataResolver
    }
  },
  // Bulk Modify Contacts of Contacts
  {
    path: 'modify-bulk',
    component: fromPages.ContactsOfContactsBulkCreateModifyComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CONTACT_OF_CONTACT_BULK_MODIFY
      ],
      action: CreateViewModifyV2Action.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ],
    resolve: {
      gender: GenderDataResolver,
      pregnancyStatus: PregnancyStatusDataResolver,
      occupation: OccupationDataResolver,
      risk: RiskDataResolver,
      yesNo: YesNoDataResolver
    }
  },
  // View Contact of contact movement
  {
    path: ':contactOfContactId/movement',
    component: fromPages.ViewMovementContactOfContactComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CONTACT_OF_CONTACT_VIEW_MOVEMENT_MAP
      ]
    }
  },
  // View Contact of contact  chronology
  {
    path: ':contactOfContactId/chronology',
    component: fromPages.ViewChronologyContactOfContactComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CONTACT_OF_CONTACT_VIEW_CHRONOLOGY_CHART
      ]
    }
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
