import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';

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
        component: fromPages.CreateEntityRelationshipComponent
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
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
