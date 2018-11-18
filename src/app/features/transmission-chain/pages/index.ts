// import each page component
import { TransmissionChainsListComponent } from './transmission-chains-list/transmission-chains-list.component';
import { TransmissionChainsGeoMapComponent } from './transmission-chains-geo-map/transmission-chains-geo-map.component';
import { TransmissionChainsGraphComponent } from './transmission-chains-graph/transmission-chains-graph.component';
import { CaseCountMapComponent } from './case-count-map/case-count-map.component';

// export each page component individually
export * from './transmission-chains-list/transmission-chains-list.component';
export * from './transmission-chains-geo-map/transmission-chains-geo-map.component';
export * from './transmission-chains-graph/transmission-chains-graph.component';
export * from './case-count-map/case-count-map.component';

// export the list of all page components
export const pageComponents: any[] = [
    TransmissionChainsListComponent,
    TransmissionChainsGeoMapComponent,
    TransmissionChainsGraphComponent,
    CaseCountMapComponent
];
