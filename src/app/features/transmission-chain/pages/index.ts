// import each page component
import { TransmissionChainsListComponent } from './transmission-chains-list/transmission-chains-list.component';
import { ViewTransmissionChainComponent } from './view-transmission-chain/view-transmission-chain.component';

// export each page component individually
export * from './transmission-chains-list/transmission-chains-list.component';
export * from './view-transmission-chain/view-transmission-chain.component';

// export the list of all page components
export const pageComponents: any[] = [
    TransmissionChainsListComponent,
    ViewTransmissionChainComponent
];
