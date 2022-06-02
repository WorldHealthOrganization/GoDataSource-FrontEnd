import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RelationshipType } from '../../core/enums/relationship-type.enum';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PERMISSION } from '../../core/models/permission.model';
import { PermissionExpression } from '../../core/models/user.model';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { CertaintyLevelDataResolver } from '../../core/services/resolvers/data/certainty-level.resolver';
import { ClusterDataResolver } from '../../core/services/resolvers/data/cluster.resolver';
import { ContextOfTransmissionDataResolver } from '../../core/services/resolvers/data/context-of-transmission.resolver';
import { ExposureDurationDataResolver } from '../../core/services/resolvers/data/exposure-duration.resolver';
import { ExposureFrequencyDataResolver } from '../../core/services/resolvers/data/exposure-frequency.resolver';
import { ExposureTypeDataResolver } from '../../core/services/resolvers/data/exposure-type.resolver';
import { PersonTypeDataResolver } from '../../core/services/resolvers/data/person-type.resolver';
import { RelationshipPersonDataResolver } from '../../core/services/resolvers/data/relationship-person.resolver';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import * as fromPages from './pages';
import { GenderDataResolver } from '../../core/services/resolvers/data/gender.resolver';
import { RiskDataResolver } from '../../core/services/resolvers/data/risk.resolver';
import { ClassificationDataResolver } from '../../core/services/resolvers/data/classification.resolver';

const relationshipTypeChildrenRoutes = [
  // Relationships list
  {
    path: '',
    component: fromPages.EntityRelationshipsListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.RELATIONSHIP_LIST
      ]
    },
    resolve: {
      yesNoAll: YesNoAllDataResolver,
      certaintyLevel: CertaintyLevelDataResolver,
      exposureType: ExposureTypeDataResolver,
      exposureFrequency: ExposureFrequencyDataResolver,
      exposureDuration: ExposureDurationDataResolver,
      contextOfTransmission: ContextOfTransmissionDataResolver,
      cluster: ClusterDataResolver,
      personType: PersonTypeDataResolver,
      user: UserDataResolver,
      entity: RelationshipPersonDataResolver
    }
  },
  // Create relationships (1): List available persons to be selected for creating new relationships
  {
    path: 'available-entities',
    component: fromPages.AvailableEntitiesListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.RELATIONSHIP_CREATE
      ]
    },
    resolve: {
      yesNoAll: YesNoAllDataResolver,
      entity: RelationshipPersonDataResolver,
      gender: GenderDataResolver,
      risk: RiskDataResolver,
      classification: ClassificationDataResolver,
      personType: PersonTypeDataResolver
    }
  },
  // Create relationships (2): Create relationships form
  {
    path: 'create',
    component: fromPages.CreateEntityRelationshipComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.RELATIONSHIP_CREATE
      ]
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // Share selected relationships (1): Select people to share with
  {
    path: 'share',
    component: fromPages.EntityRelationshipsListAssignComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.RELATIONSHIP_SHARE
      ]
    }
  },
  // Share selected relationships (2): Create relationships form
  {
    path: 'share/create-bulk',
    component: fromPages.CreateEntityRelationshipBulkComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.RELATIONSHIP_SHARE
      ]
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // Switch Contact or Source for selected relationships
  {
    path: 'switch',
    component: fromPages.AvailableEntitiesForSwitchListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: new PermissionExpression({
        and: [
          PERMISSION.OUTBREAK_VIEW,
          new PermissionExpression({
            or: [
              PERMISSION.CASE_CHANGE_SOURCE_RELATIONSHIP,
              PERMISSION.CONTACT_CHANGE_SOURCE_RELATIONSHIP,
              PERMISSION.CONTACT_OF_CONTACT_CHANGE_SOURCE_RELATIONSHIP,
              PERMISSION.EVENT_CHANGE_SOURCE_RELATIONSHIP
            ]
          })
        ]
      })
    }
  },
  // View Relationship
  {
    path: ':relationshipId/view',
    component: fromPages.ModifyEntityRelationshipComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.RELATIONSHIP_VIEW
      ],
      action: ViewModifyComponentAction.VIEW
    }
  },
  // Modify Relationship
  {
    path: ':relationshipId/modify',
    component: fromPages.ModifyEntityRelationshipComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.RELATIONSHIP_MODIFY
      ],
      action: ViewModifyComponentAction.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  }
];

const routes: Routes = [
  // Entity Exposure Relationships
  {
    path: ':entityType/:entityId/exposures',
    data: {
      relationshipType: RelationshipType.EXPOSURE
    },
    children: relationshipTypeChildrenRoutes
  },
  // Entity Contact Relationships
  {
    path: ':entityType/:entityId/contacts',
    data: {
      relationshipType: RelationshipType.CONTACT
    },
    children: relationshipTypeChildrenRoutes
  },
  // View Case with onset date that is before the date of onset of the primary case
  {
    path: 'date-onset',
    component: fromPages.ReportCasesDateOnsetListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CASE_LIST_ONSET_BEFORE_PRIMARY_CASE_REPORT
      ]
    },
    resolve: {
      yesNoAll: YesNoAllDataResolver
    }
  },
  // Report about the long periods in the dates of onset between cases in the chain of transmission i.e. indicate where an intermediate contact may have been missed
  {
    path: 'long-period',
    component: fromPages.ReportRelationshipsLongPeriodListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.CASE_LIST_LONG_PERIOD_BETWEEN_DATES_REPORT
      ]
    },
    resolve: {
      yesNoAll: YesNoAllDataResolver
    }
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
