import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';

const routes: Routes = [
    // Entity Relationships list
    {
        path: ':entityType/:entityId',
        component: fromPages.EntityRelationshipsListComponent
    },
    // List available entities to be related with a given entity
    {
        path: ':entityType/:entityId/available-entities',
        component: fromPages.AvailableEntitiesListComponent
    },
    // Create new Entity relationship(s)
    {
        path: ':entityType/:entityId/create',
        component: fromPages.CreateEntityRelationshipComponent,
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View Entity Relationship
    {
        path: ':entityType/:entityId/:relationshipId/view',
        component: fromPages.ModifyEntityRelationshipComponent,
        data: {
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Entity Relationship
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
