import { ModuleWithProviders } from '@angular/core';
import { Route, RouterModule, Routes } from '@angular/router';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { DailyFollowUpStatusDataResolver } from '../../core/services/resolvers/data/daily-follow-up-status.resolver';
import { FinalFollowUpStatusDataResolver } from '../../core/services/resolvers/data/final-follow-up-status.resolver';
import { GenderDataResolver } from '../../core/services/resolvers/data/gender.resolver';
import { OccupationDataResolver } from '../../core/services/resolvers/data/occupation.resolver';
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

// Follow-ups list from a - contact / case
const viewFolowUpsListFoundation: Route = {
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
    component: fromPages.CreateContactComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CONTACT_CREATE
      ]
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Contact
  {
    path: ':contactId/view',
    component: fromPages.ModifyContactComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CONTACT_VIEW
      ],
      action: ViewModifyComponentAction.VIEW
    }
  },
  // Modify Contact
  {
    path: ':contactId/modify',
    component: fromPages.ModifyContactComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CONTACT_MODIFY
      ],
      action: ViewModifyComponentAction.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Contact Questionnaire
  {
    path: ':contactId/view-questionnaire',
    component: fromPages.ModifyQuestionnaireContactComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CONTACT_VIEW
      ],
      action: ViewModifyComponentAction.VIEW
    }
  },
  // Modify Contact Questionnaire
  {
    path: ':contactId/modify-questionnaire',
    component: fromPages.ModifyQuestionnaireContactComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CONTACT_MODIFY
      ],
      action: ViewModifyComponentAction.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Case Questionnaire
  {
    path: ':contactId/history',
    component: fromPages.ModifyQuestionnaireContactComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CONTACT_VIEW
      ],
      action: ViewModifyComponentAction.HISTORY
    }
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
    component: fromPages.ContactDailyFollowUpsListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.FOLLOW_UP_LIST
      ]
    }
  },
  // Follow-ups list from a case
  {
    path: 'case-related-follow-ups/:caseId',
    component: fromPages.ContactDailyFollowUpsListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.FOLLOW_UP_LIST
      ]
    }
  },
  // Follow-ups list from a contact
  {
    path: 'contact-related-follow-ups/:contactId',
    ...viewFolowUpsListFoundation,
    data: {
      permissions: [
        PERMISSION.FOLLOW_UP_LIST
      ]
    }
  },
  // Follow-ups list from a case
  {
    path: 'case-follow-ups/:caseId',
    ...viewFolowUpsListFoundation,
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
    component: fromPages.CreateContactFollowUpComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.FOLLOW_UP_CREATE
      ]
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Follow Up
  {
    path: ':contactId/follow-ups/:followUpId/view',
    component: fromPages.ModifyContactFollowUpComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.FOLLOW_UP_VIEW
      ],
      action: ViewModifyComponentAction.VIEW
    }
  },
  // Modify Follow Up
  {
    path: ':contactId/follow-ups/:followUpId/modify',
    component: fromPages.ModifyContactFollowUpComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.FOLLOW_UP_MODIFY
      ],
      action: ViewModifyComponentAction.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View History Follow Up
  {
    path: ':contactId/follow-ups/:followUpId/history',
    component: fromPages.ModifyContactFollowUpComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.FOLLOW_UP_VIEW
      ],
      action: ViewModifyComponentAction.HISTORY
    }
  },
  // View Contact Questionnaire
  {
    path: ':contactId/follow-ups/:followUpId/view-questionnaire',
    component: fromPages.ModifyQuestionnaireContactFollowUpComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.FOLLOW_UP_VIEW
      ],
      action: ViewModifyComponentAction.VIEW
    }
  },
  // Modify Contact Questionnaire
  {
    path: ':contactId/follow-ups/:followUpId/modify-questionnaire',
    component: fromPages.ModifyQuestionnaireContactFollowUpComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.FOLLOW_UP_MODIFY
      ],
      action: ViewModifyComponentAction.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View History Questionnaire
  {
    path: ':contactId/follow-ups/:followUpId/history-questionnaire',
    component: fromPages.ModifyQuestionnaireContactFollowUpComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.FOLLOW_UP_VIEW
      ],
      action: ViewModifyComponentAction.HISTORY
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
