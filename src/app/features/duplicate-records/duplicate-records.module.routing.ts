import { ModuleWithProviders } from '@angular/core';
import { Route, RouterModule, Routes } from '@angular/router';
import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { GenderDataResolver } from '../../core/services/resolvers/data/gender.resolver';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import * as fromPages from './pages';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { DocumentTypeDataResolver } from '../../core/services/resolvers/data/document-type.resolver';
import { SelectedOutbreakDataResolver } from '../../core/services/resolvers/data/selected-outbreak.resolver';
import { AddressTypeDataResolver } from '../../core/services/resolvers/data/address-type.resolver';
import { VaccineDataResolver } from '../../core/services/resolvers/data/vaccine.resolver';
import { VaccineStatusDataResolver } from '../../core/services/resolvers/data/vaccine-status.resolver';
import { PersonDateTypeDataResolver } from '../../core/services/resolvers/data/person-date-type.resolver';
import { DateRangeCenterDataResolver } from '../../core/services/resolvers/data/date-range-center.resolver';


// Not Duplicates List - Cases / Contacts / Contacts of Contacts
const noDuplicatesListFoundation: Route = {
  component: fromPages.MarkedNotDuplicatesListComponent,
  canActivate: [AuthGuard],
  resolve: {
    yesNoAll: YesNoAllDataResolver,
    gender: GenderDataResolver
  }
};

const routes: Routes = [
  // Duplicate records list
  {
    path: '',
    component: fromPages.DuplicateRecordsListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [PERMISSION.DUPLICATE_LIST]
    }
  },

  // Case - Merge
  {
    path: 'cases/merge',
    component: fromPages.CaseMergeDuplicateRecordsCreateViewModifyComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.DUPLICATE_MERGE_CASES
      ],
      action: CreateViewModifyV2Action.MODIFY
    },
    resolve: {
      outbreak: SelectedOutbreakDataResolver,
      documentType: DocumentTypeDataResolver,
      addressType: AddressTypeDataResolver,
      vaccine: VaccineDataResolver,
      vaccineStatus: VaccineStatusDataResolver,
      dateRangeType: PersonDateTypeDataResolver,
      dateRangeCenter: DateRangeCenterDataResolver
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },

  // Contact - Merge
  {
    path: 'contacts/merge',
    component: fromPages.ContactMergeDuplicateRecordsComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.DUPLICATE_MERGE_CONTACTS
      ]
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },

  // Contact of contact - Merge
  {
    path: 'contacts-of-contacts/merge',
    component: fromPages.ContactOfContactMergeDuplicateComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.DUPLICATE_MERGE_CONTACTS_OF_CONTACTS
      ]
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },

  // Event - Merge
  {
    path: 'events/merge',
    component: fromPages.EventMergeDuplicateRecordsComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.DUPLICATE_MERGE_EVENTS
      ]
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },

  // Not Duplicates List - Cases
  {
    path: 'cases/:caseId/marked-not-duplicates',
    ...noDuplicatesListFoundation,
    data: {
      permissions: [
        PERMISSION.CASE_LIST
      ]
    }
  },
  // Not Duplicates List - Contacts
  {
    path: 'contacts/:contactId/marked-not-duplicates',
    ...noDuplicatesListFoundation,
    data: {
      permissions: [
        PERMISSION.CONTACT_LIST
      ]
    }
  },
  // Not Duplicates List - Contacts of Contacts
  {
    path: 'contacts-of-contacts/:contactOfContactId/marked-not-duplicates',
    ...noDuplicatesListFoundation,
    data: {
      permissions: [
        PERMISSION.CONTACT_OF_CONTACT_LIST
      ]
    }
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
