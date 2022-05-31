import { ModuleWithProviders } from '@angular/core';
import { Route, RouterModule, Routes } from '@angular/router';
import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { ClassificationDataResolver } from '../../core/services/resolvers/data/classification.resolver';
import { DailyFollowUpStatusDataResolver } from '../../core/services/resolvers/data/daily-follow-up-status.resolver';
import { FinalFollowUpStatusDataResolver } from '../../core/services/resolvers/data/final-follow-up-status.resolver';
import { GenderDataResolver } from '../../core/services/resolvers/data/gender.resolver';
import { OccupationDataResolver } from '../../core/services/resolvers/data/occupation.resolver';
import { OutcomeDataResolver } from '../../core/services/resolvers/data/outcome.resolver';
import { PersonDataResolver } from '../../core/services/resolvers/data/person.resolver';
import { PregnancyStatusDataResolver } from '../../core/services/resolvers/data/pregnancy-status.resolver';
import { RiskDataResolver } from '../../core/services/resolvers/data/risk.resolver';
import { TeamDataResolver } from '../../core/services/resolvers/data/team.resolver';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { YesNoDataResolver } from '../../core/services/resolvers/data/yes-no.resolver';
import { VaccineStatusDataResolver } from './../../core/services/resolvers/data/vaccine-status.resolver';
import { VaccineDataResolver } from './../../core/services/resolvers/data/vaccine.resolver';
import * as fromPages from './pages';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { DocumentTypeDataResolver } from '../../core/services/resolvers/data/document-type.resolver';
import { AddressTypeDataResolver } from '../../core/services/resolvers/data/address-type.resolver';
import { ContactsCreateViewModifyComponent } from './pages/contacts-create-view-modify/contacts-create-view-modify.component';
import { SelectedOutbreakDataResolver } from '../../core/services/resolvers/data/selected-outbreak.resolver';
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

// Follow-ups list from a - contact / case
const viewFollowUpsListFoundation: Route = {
  component: fromPages.IndividualContactFollowUpsListComponent,
  canActivate: [AuthGuard],
  resolve: {
    yesNoAll: YesNoAllDataResolver,
    team: TeamDataResolver,
    dailyFollowUpStatus: DailyFollowUpStatusDataResolver,
    user: UserDataResolver,
    entityData: PersonDataResolver,
    yesNo: YesNoDataResolver
  }
};

// Daily Follow-ups list / Follow-ups list from a case
const dailyFollowUpsListFoundation: Route = {
  component: fromPages.ContactDailyFollowUpsListComponent,
  canActivate: [AuthGuard],
  resolve: {
    yesNoAll: YesNoAllDataResolver,
    team: TeamDataResolver,
    dailyFollowUpStatus: DailyFollowUpStatusDataResolver,
    risk: RiskDataResolver,
    user: UserDataResolver,
    yesNo: YesNoDataResolver,
    gender: GenderDataResolver,
    occupation: OccupationDataResolver,
    classification: ClassificationDataResolver,
    outcome: OutcomeDataResolver,
    entityData: PersonDataResolver
  }
};

// Contact - create / view modify
const contactFoundation: Route = {
  component: ContactsCreateViewModifyComponent,
  canActivate: [AuthGuard],
  resolve: {
    outbreak: SelectedOutbreakDataResolver,
    gender: GenderDataResolver,
    pregnancy: PregnancyStatusDataResolver,
    occupation: OccupationDataResolver,
    user: UserDataResolver,
    documentType: DocumentTypeDataResolver,
    addressType: AddressTypeDataResolver,
    risk: RiskDataResolver,
    vaccine: VaccineDataResolver,
    vaccineStatus: VaccineStatusDataResolver,
    followUpStatus: FinalFollowUpStatusDataResolver,
    yesNo: YesNoDataResolver,
    team: TeamDataResolver,
    dailyFollowUpStatus: DailyFollowUpStatusDataResolver,
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
    labSequenceResult: LabSequenceResultDataResolver
  }
};

// Follow-up - create / view / modify
const followUpFoundation: Route = {
  component: fromPages.FollowUpCreateViewModifyComponent,
  canActivate: [AuthGuard],
  resolve: {
    outbreak: SelectedOutbreakDataResolver,
    entityData: PersonDataResolver,
    user: UserDataResolver,
    dailyFollowUpStatus: DailyFollowUpStatusDataResolver,
    team: TeamDataResolver,
    addressType: AddressTypeDataResolver,
    yesNoAll: YesNoAllDataResolver
  }
};

// routes
const routes: Routes = [
  // Contact list
  {
    path: '',
    component: fromPages.ContactsListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CONTACT_LIST
      ]
    },
    resolve: {
      pregnancyStatus: PregnancyStatusDataResolver,
      gender: GenderDataResolver,
      risk: RiskDataResolver,
      yesNoAll: YesNoAllDataResolver,
      yesNo: YesNoDataResolver,
      user: UserDataResolver,
      occupation: OccupationDataResolver,
      vaccine: VaccineDataResolver,
      vaccineStatus: VaccineStatusDataResolver,
      followUpStatus: FinalFollowUpStatusDataResolver,
      dailyFollowUpStatus: DailyFollowUpStatusDataResolver,
      team: TeamDataResolver
    }
  },
  // Create Contact
  {
    path: 'create',
    ...contactFoundation,
    data: {
      permissions: [
        PERMISSION.CONTACT_CREATE
      ],
      action: CreateViewModifyV2Action.CREATE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Contact
  {
    path: ':contactId/view',
    ...contactFoundation,
    data: {
      permissions: [
        PERMISSION.CONTACT_VIEW
      ],
      action: CreateViewModifyV2Action.VIEW
    }
  },
  // Modify Contact
  {
    path: ':contactId/modify',
    ...contactFoundation,
    data: {
      permissions: [
        PERMISSION.CONTACT_MODIFY
      ],
      action: CreateViewModifyV2Action.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // Bulk Add Contacts
  {
    path: 'create-bulk',
    component: fromPages.BulkCreateContactsComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CONTACT_BULK_CREATE
      ]
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // Bulk Modify Contacts
  {
    path: 'modify-bulk',
    component: fromPages.BulkModifyContactsComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CONTACT_BULK_MODIFY
      ]
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },

  // View Contact movement
  {
    path: ':contactId/movement',
    component: fromPages.ViewMovementContactComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CONTACT_VIEW_MOVEMENT_MAP
      ]
    }
  },

  // View Contact chronology
  {
    path: ':contactId/chronology',
    component: fromPages.ViewChronologyContactComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CONTACT_VIEW_CHRONOLOGY_CHART
      ]
    }
  },

  // Daily Follow-ups list
  {
    path: 'follow-ups',
    ...dailyFollowUpsListFoundation,
    data: {
      permissions: [
        PERMISSION.FOLLOW_UP_LIST
      ]
    }
  },
  // Follow-ups list from a case
  {
    path: 'case-related-follow-ups/:caseId',
    ...dailyFollowUpsListFoundation,
    data: {
      permissions: [
        PERMISSION.FOLLOW_UP_LIST
      ]
    }
  },
  // Follow-ups list from a contact
  {
    path: 'contact-related-follow-ups/:contactId',
    ...viewFollowUpsListFoundation,
    data: {
      permissions: [
        PERMISSION.FOLLOW_UP_LIST
      ]
    }
  },
  // Follow-ups list from a case
  {
    path: 'case-follow-ups/:caseId',
    ...viewFollowUpsListFoundation,
    data: {
      permissions: [
        PERMISSION.FOLLOW_UP_LIST
      ]
    }
  },
  // Range Follow-ups list
  {
    path: 'range-follow-ups',
    component: fromPages.ContactRangeFollowUpsListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.FOLLOW_UP_LIST_RANGE
      ]
    }
  },
  // Create Follow Up
  {
    path: ':contactId/follow-ups/create',
    ...followUpFoundation,
    data: {
      permissions: [
        PERMISSION.FOLLOW_UP_CREATE
      ],
      action: CreateViewModifyV2Action.CREATE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Follow Up
  {
    path: ':contactId/follow-ups/:followUpId/view',
    ...followUpFoundation,
    data: {
      permissions: [
        PERMISSION.FOLLOW_UP_VIEW
      ],
      action: CreateViewModifyV2Action.VIEW
    }
  },
  // Modify Follow Up
  {
    path: ':contactId/follow-ups/:followUpId/modify',
    ...followUpFoundation,
    data: {
      permissions: [
        PERMISSION.FOLLOW_UP_MODIFY
      ],
      action: CreateViewModifyV2Action.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View History Follow Up
  {
    path: ':contactId/follow-ups/:followUpId/history',
    ...followUpFoundation,
    data: {
      permissions: [
        PERMISSION.FOLLOW_UP_VIEW
      ],
      action: CreateViewModifyV2Action.VIEW
    }
  },
  // Modify list of Follow Ups
  {
    path: 'follow-ups/modify-list',
    component: fromPages.ModifyContactFollowUpListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.FOLLOW_UP_BULK_MODIFY
      ]
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
