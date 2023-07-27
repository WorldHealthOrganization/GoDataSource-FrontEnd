import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';

import * as fromPages from './pages';
import { Constants } from '../../core/models/constants';
import { SavedImportMappingDataResolver } from '../../core/services/resolvers/data/saved-import-mapping.resolver';
import { SelectedLanguageDataResolver } from '../../core/services/resolvers/data/selected-language.resolver';
import { UserRoleDataResolver } from '../../core/services/resolvers/data/user-role.resolver';
import { OutbreakDataResolver } from '../../core/services/resolvers/data/outbreak.resolver';

const routes: Routes = [
  // Import locations
  {
    path: 'location-data/import',
    component: fromPages.ImportLocationDataComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.LOCATION_IMPORT
      ],
      savedImportPage: Constants.APP_IMPORT_PAGE.LOCATION_DATA.value
    },
    resolve: {
      savedImportMapping: SavedImportMappingDataResolver
    }
  },
  // Import hierarchical locations
  {
    path: 'hierarchical-locations/import',
    component: fromPages.ImportHierarchicalLocationsComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.LOCATION_IMPORT
      ]
    }
  },

  // Import Language Tokens
  {
    path: 'language-data/:languageId/import-tokens',
    component: fromPages.ImportLanguageTokensComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.LANGUAGE_IMPORT_TOKENS
      ]
    },
    resolve: {
      language: SelectedLanguageDataResolver
    }
  },

  // Import reference data
  {
    path: 'reference-data/import',
    component: fromPages.ImportReferenceDataComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.REFERENCE_DATA_IMPORT
      ],
      savedImportPage: Constants.APP_IMPORT_PAGE.REFERENCE_DATA.value
    },
    resolve: {
      savedImportMapping: SavedImportMappingDataResolver
    }
  },

  // Import case data
  {
    path: 'case-data/import',
    component: fromPages.ImportCaseDataComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CASE_IMPORT
      ],
      savedImportPage: Constants.APP_IMPORT_PAGE.CASE.value
    },
    resolve: {
      savedImportMapping: SavedImportMappingDataResolver
    }
  },

  // Import event data
  {
    path: 'event-data/import',
    component: fromPages.ImportEventDataComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.EVENT_IMPORT
      ],
      savedImportPage: Constants.APP_IMPORT_PAGE.EVENT.value
    },
    resolve: {
      savedImportMapping: SavedImportMappingDataResolver
    }
  },

  // Import case lab data
  {
    path: 'case-lab-data/import',
    component: fromPages.ImportCaseLabDataComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CASE_IMPORT_LAB_RESULT
      ],
      savedImportPage: Constants.APP_IMPORT_PAGE.CASE_LAB_DATA.value
    },
    resolve: {
      savedImportMapping: SavedImportMappingDataResolver
    }
  },

  // Import contact data
  {
    path: 'contact-data/import',
    component: fromPages.ImportContactDataComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CONTACT_IMPORT
      ],
      savedImportPage: Constants.APP_IMPORT_PAGE.CONTACT.value
    },
    resolve: {
      savedImportMapping: SavedImportMappingDataResolver
    }
  },

  // Import contact of contact data
  {
    path: 'contact-of-contact-data/import',
    component: fromPages.ImportContactOfContactDataComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CONTACT_OF_CONTACT_IMPORT
      ],
      savedImportPage: Constants.APP_IMPORT_PAGE.CONTACT_OF_CONTACT.value
    },
    resolve: {
      savedImportMapping: SavedImportMappingDataResolver
    }
  },

  // Import contact lab data
  {
    path: 'contact-lab-data/import',
    component: fromPages.ImportContactLabDataComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CONTACT_IMPORT_LAB_RESULT
      ],
      savedImportPage: Constants.APP_IMPORT_PAGE.CONTACT_LAB_DATA.value
    },
    resolve: {
      savedImportMapping: SavedImportMappingDataResolver
    }
  },

  // Import sync package
  {
    path: 'sync-package/import',
    component: fromPages.ImportSyncPackageComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.SYNC_IMPORT_PACKAGE
      ]
    }
  },

  // Import relationships data
  {
    path: 'relationships/import',
    component: fromPages.ImportRelationshipDataComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_IMPORT_RELATIONSHIP
      ],
      savedImportPage: Constants.APP_IMPORT_PAGE.RELATIONSHIP_DATA.value
    },
    resolve: {
      savedImportMapping: SavedImportMappingDataResolver
    }
  },

  // Import user data
  {
    path: 'user-data/import',
    component: fromPages.ImportUserDataComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.USER_IMPORT
      ],
      savedImportPage: Constants.APP_IMPORT_PAGE.USER_DATA.value
    },
    resolve: {
      savedImportMapping: SavedImportMappingDataResolver,
      userRole: UserRoleDataResolver,
      outbreak: OutbreakDataResolver
    }
  },

  // Import user role data
  {
    path: 'user-role-data/import',
    component: fromPages.ImportUserRoleDataComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.USER_ROLE_IMPORT
      ],
      savedImportPage: Constants.APP_IMPORT_PAGE.ROLE_DATA.value
    },
    resolve: {
      savedImportMapping: SavedImportMappingDataResolver
    }
  },

  // Import team data
  {
    path: 'team-data/import',
    component: fromPages.ImportTeamDataComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.TEAM_IMPORT
      ],
      savedImportPage: Constants.APP_IMPORT_PAGE.TEAM_DATA.value
    },
    resolve: {
      savedImportMapping: SavedImportMappingDataResolver
    }
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
