// import each page component
import { EntityRelationshipsListComponent } from './entity-relationships-list/entity-relationships-list.component';
import { ModifyEntityRelationshipComponent } from './modify-entity-relationship/modify-entity-relationship.component';
import { AvailableEntitiesListComponent } from './available-entities-list/available-entities-list.component';
import { CreateEntityRelationshipComponent } from './create-entity-relationship/create-entity-relationship.component';
import { CasesDateOnsetListComponent } from './cases-date-onset-list/cases-date-onset-list.component';

// export each page component individually
export * from './entity-relationships-list/entity-relationships-list.component';
export * from './modify-entity-relationship/modify-entity-relationship.component';
export * from './available-entities-list/available-entities-list.component';
export * from './create-entity-relationship/create-entity-relationship.component';
export * from './cases-date-onset-list/cases-date-onset-list.component';

// export the list of all page components
export const pageComponents: any[] = [
    EntityRelationshipsListComponent,
    ModifyEntityRelationshipComponent,
    AvailableEntitiesListComponent,
    CreateEntityRelationshipComponent,
    CasesDateOnsetListComponent
];
