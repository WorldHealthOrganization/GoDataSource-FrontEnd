// import each page component
import { EntityRelationshipsListComponent } from './entity-relationships-list/entity-relationships-list.component';
import { ModifyEntityRelationshipComponent } from './modify-entity-relationship/modify-entity-relationship.component';
import { AvailableEntitiesListComponent } from './available-entities-list/available-entities-list.component';
import { CreateEntityRelationshipComponent } from './create-entity-relationship/create-entity-relationship.component';
import { ReportCasesDateOnsetListComponent } from './report-cases-date-onset-list/report-cases-date-onset-list.component';
import { ReportRelationshipsLongPeriodListComponent } from './report-relationships-long-period-list/report-relationships-long-period-list.component';
import { EntityRelationshipsListAssignComponent } from './entity-relationships-list-assign/entity-relationships-list-assign.component';
import { CreateEntityRelationshipBulkComponent } from './create-entity-relationship-bulk/create-entity-relationship-bulk.component';

// export each page component individually
export * from './entity-relationships-list/entity-relationships-list.component';
export * from './modify-entity-relationship/modify-entity-relationship.component';
export * from './available-entities-list/available-entities-list.component';
export * from './create-entity-relationship/create-entity-relationship.component';
export * from './report-cases-date-onset-list/report-cases-date-onset-list.component';
export * from './report-relationships-long-period-list/report-relationships-long-period-list.component';
export * from './entity-relationships-list-assign/entity-relationships-list-assign.component';
export * from './create-entity-relationship-bulk/create-entity-relationship-bulk.component';

// export the list of all page components
export const pageComponents: any[] = [
    EntityRelationshipsListComponent,
    ModifyEntityRelationshipComponent,
    AvailableEntitiesListComponent,
    CreateEntityRelationshipComponent,
    ReportCasesDateOnsetListComponent,
    ReportRelationshipsLongPeriodListComponent,
    EntityRelationshipsListAssignComponent,
    CreateEntityRelationshipBulkComponent
];
