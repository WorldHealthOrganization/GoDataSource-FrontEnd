import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { RelationshipType } from '../../core/enums/relationship-type.enum';

const routes: Routes = [
    // Entity Exposure Relationships
    {
        path: ':entityType/:entityId/exposures',
        data: {
            relationshipType: RelationshipType.EXPOSURE
        },
        children: [
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
        ]
    },
    // Entity Contact Relationships
    {
        path: ':entityType/:entityId/contacts',
        data: {
            relationshipType: RelationshipType.CONTACT
        },
        children: [
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
        ]
    },
    // #TODO remove View Entity Relationship
    {
        path: ':entityType/:entityId/:relationshipId/view',
        component: fromPages.ModifyEntityRelationshipComponent,
        data: {
            action: ViewModifyComponentAction.VIEW
        }
    },
    // #TODO remove Modify Entity Relationship
    {
        path: ':entityType/:entityId/:relationshipId/modify',
        component: fromPages.ModifyEntityRelationshipComponent,
        data: {
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View Case with onset date that is before the date of onset of the primary case
    {
        path: 'date-onset',
        component: fromPages.ReportCasesDateOnsetListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
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
                PERMISSION.READ_REPORT
            ]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
