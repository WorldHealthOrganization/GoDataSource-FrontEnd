// import each page component
import { LocationsListComponent } from './locations-list/locations-list.component';
import { CreateLocationComponent } from './create-location/create-location.component';
import { ModifyLocationComponent } from './modify-location/modify-location.component';
import { LocationUsageListComponent } from './location-usage-list/location-usage-list.component';

// export each page component individually
export * from './locations-list/locations-list.component';
export * from './create-location/create-location.component';
export * from './modify-location/modify-location.component';
export * from './location-usage-list/location-usage-list.component';

// export the list of all page components
export const pageComponents: any[] = [
    LocationsListComponent,
    CreateLocationComponent,
    ModifyLocationComponent,
    LocationUsageListComponent
];
