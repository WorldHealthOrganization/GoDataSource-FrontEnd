import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { DailyFollowUpStatusDataResolver } from '../../core/services/resolvers/data/daily-follow-up-status.resolver';
import { FinalFollowUpStatusDataResolver } from '../../core/services/resolvers/data/final-follow-up-status.resolver';
import { GenderDataResolver } from '../../core/services/resolvers/data/gender.resolver';
import { OccupationDataResolver } from '../../core/services/resolvers/data/occupation.resolver';
import { PregnancyStatusDataResolver } from '../../core/services/resolvers/data/pregnancy-status.resolver';
import { RiskDataResolver } from '../../core/services/resolvers/data/risk.resolver';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { YesNoDataResolver } from '../../core/services/resolvers/data/yes-no.resolver';
import { VaccineStatusDataResolver } from './../../core/services/resolvers/data/vaccine-status.resolver';
import { VaccineDataResolver } from './../../core/services/resolvers/data/vaccine.resolver';
import * as fromPages from './pages';

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
      pregnancy: PregnancyStatusDataResolver,
      gender: GenderDataResolver,
      risk: RiskDataResolver,
      yesNoAll: YesNoAllDataResolver,
      yesNo: YesNoDataResolver,
      user: UserDataResolver,
      occupation: OccupationDataResolver,
      vaccine: VaccineDataResolver,
      vaccineStatus: VaccineStatusDataResolver,
      followUp: FinalFollowUpStatusDataResolver,
      dailyFollowUp: DailyFollowUpStatusDataResolver
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
    component: fromPages.IndividualContactFollowUpsListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.FOLLOW_UP_LIST
      ]
    }
  },
  // Follow-ups list from a case
  {
    path: 'case-follow-ups/:caseId',
    component: fromPages.IndividualContactFollowUpsListComponent,
    canActivate: [AuthGuard],
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
