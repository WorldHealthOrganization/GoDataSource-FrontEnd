import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import * as fromPages from './pages';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { RelationshipType } from '../../core/enums/relationship-type.enum';
import { PermissionExpression } from '../../core/models/user.model';

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
    },
];

const routes: Routes = [
    // Entity Exposure Relationships
    {
        path: ':entityType/:entityId/exposures',
        data: {
            relationshipType: RelationshipType.EXPOSURE
        },
        children: relationshipTypeChildrenRoutes,
    },
    // Entity Contact Relationships
    {
        path: ':entityType/:entityId/contacts',
        data: {
            relationshipType: RelationshipType.CONTACT
        },
        children: relationshipTypeChildrenRoutes
    },
    // // Entity Contact of Contact Relationship
    // {
    //     path: ':entityType/:entityId/contacts-of-contacts',
    //     data: {
    //         relationshipType: RelationshipType.CONTACT_OF_CONTACT
    //     },
    //     children: relationshipTypeChildrenRoutes
    // },
    // View Case with onset date that is before the date of onset of the primary case
    {
        path: 'date-onset',
        component: fromPages.ReportCasesDateOnsetListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CASE_LIST_ONSET_BEFORE_PRIMARY_CASE_REPORT
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
                PERMISSION.CASE_LIST_LONG_PERIOD_BETWEEN_DATES_REPORT
            ]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
