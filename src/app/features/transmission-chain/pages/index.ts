// import each page component
import { TransmissionChainsListComponent } from './transmission-chains-list/transmission-chains-list.component';
import { TransmissionChainsGraphComponent } from './transmission-chains-graph/transmission-chains-graph.component';
import { CaseCountMapComponent } from './case-count-map/case-count-map.component';
import { TransmissionChainsSnapshotListComponent } from './transmission-chains-snapshot-list/transmission-chains-snapshot-list.component';

// export each page component individually
export * from './transmission-chains-list/transmission-chains-list.component';
export * from './transmission-chains-graph/transmission-chains-graph.component';
export * from './case-count-map/case-count-map.component';
export * from './transmission-chains-snapshot-list/transmission-chains-snapshot-list.component';

// export the list of all page components
export const pageComponents: any[] = [
  TransmissionChainsListComponent,
  TransmissionChainsGraphComponent,
  CaseCountMapComponent,
  TransmissionChainsSnapshotListComponent
];
