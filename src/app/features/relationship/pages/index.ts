// import each page component
import { EntityRelationshipsListComponent } from './entity-relationships-list/entity-relationships-list.component';
import { AvailableEntitiesListComponent } from './available-entities-list/available-entities-list.component';
import { ReportCasesDateOnsetListComponent } from './report-cases-date-onset-list/report-cases-date-onset-list.component';
import { ReportRelationshipsLongPeriodListComponent } from './report-relationships-long-period-list/report-relationships-long-period-list.component';
import { EntityRelationshipsListAssignComponent } from './entity-relationships-list-assign/entity-relationships-list-assign.component';
import { EntityRelationshipsListAddComponent } from './entity-relationships-list-add/entity-relationships-list-add.component';
import { CreateEntityRelationshipBulkComponent } from './create-entity-relationship-bulk/create-entity-relationship-bulk.component';
import { AvailableEntitiesForSwitchListComponent } from './available-entities-for-switch-list/available-entities-for-switch-list.component';
import { RelationshipsCreateViewModifyComponent } from './relationships-create-view-modify/relationships-create-view-modify.component';

// export each page component individually
export * from './entity-relationships-list/entity-relationships-list.component';
export * from './available-entities-list/available-entities-list.component';
export * from './report-cases-date-onset-list/report-cases-date-onset-list.component';
export * from './report-relationships-long-period-list/report-relationships-long-period-list.component';
export * from './entity-relationships-list-assign/entity-relationships-list-assign.component';
export * from './entity-relationships-list-add/entity-relationships-list-add.component';
export * from './create-entity-relationship-bulk/create-entity-relationship-bulk.component';
export * from './available-entities-for-switch-list/available-entities-for-switch-list.component';
export * from './relationships-create-view-modify/relationships-create-view-modify.component';

// export the list of all page components
export const pageComponents: any[] = [
  AvailableEntitiesForSwitchListComponent,
  AvailableEntitiesListComponent,
  CreateEntityRelationshipBulkComponent,
  EntityRelationshipsListAssignComponent,
  EntityRelationshipsListAddComponent,
  EntityRelationshipsListComponent,
  ReportCasesDateOnsetListComponent,
  ReportRelationshipsLongPeriodListComponent,
  RelationshipsCreateViewModifyComponent
];
