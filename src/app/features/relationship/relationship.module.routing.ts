import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { RelationshipType } from '../../core/enums/relationship-type.enum';

const relationshipTypeChildrenRoutes = [
    // Relationships list
    {
        path: '',
        component: fromPages.EntityRelationshipsListComponent,
    },
    // Create relationships (1): List available persons to be selected for creating new relationships
    {
        path: 'available-entities',
        component: fromPages.AvailableEntitiesListComponent
    },
    // Create relationships (2): Create relationships form
    {
        path: 'create',
        component: fromPages.CreateEntityRelationshipComponent,
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // Share selected relationships (1): Select people to share with
    {
        path: 'share',
        component: fromPages.EntityRelationshipsListAssignComponent
    },
    // Share selected relationships (2): Create relationships form
    {
        path: 'share/create-bulk',
        component: fromPages.CreateEntityRelationshipBulkComponent,
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // Switch Contact or Source for selected relationships
    {
        path: 'switch',
        component: fromPages.AvailableEntitiesForSwitchListComponent
    },
    // View Relationship
    {
        path: ':relationshipId/view',
        component: fromPages.ModifyEntityRelationshipComponent,
        data: {
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Relationship
    {
        path: ':relationshipId/modify',
        component: fromPages.ModifyEntityRelationshipComponent,
        data: {
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
];

const routes: Routes = [
    // Entity Exposure Relationships
    {
        path: ':entityType/:entityId/exposures',
        canActivate: [AuthGuard],
        data: {
            relationshipType: RelationshipType.EXPOSURE,
            permissions: [
                PERMISSION.OUTBREAK_VIEW,
                PERMISSION.RELATIONSHIP_LIST
            ]
        },
        children: relationshipTypeChildrenRoutes,
    },
    // Entity Contact Relationships
    {
        path: ':entityType/:entityId/contacts',
        canActivate: [AuthGuard],
        data: {
            relationshipType: RelationshipType.CONTACT,
            permissions: [
                PERMISSION.OUTBREAK_VIEW,
                PERMISSION.RELATIONSHIP_LIST
            ]
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
                PERMISSION.READ_OUTBREAK,
                PERMISSION.READ_CASE,
                PERMISSION.READ_REPORT
            ]
        }
    },
    // Report about the long periods in the dates of onset between cases in the chain of transmission i.e. indicate where an intermediate contact may have been missed
    {
        path: 'long-period',
        component: fromPages.ReportRelationshipsLongPeriodListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.READ_OUTBREAK,
                PERMISSION.READ_REPORT
            ]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
