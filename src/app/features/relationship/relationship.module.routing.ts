import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';

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
    // Modify Entity Relationship
    {
        path: ':entityType/:entityId/:relationshipId/modify',
        component: fromPages.ModifyEntityRelationshipComponent
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
