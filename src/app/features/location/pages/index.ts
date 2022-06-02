// import each page component
import { LocationsListComponent } from './locations-list/locations-list.component';
import { LocationUsageListComponent } from './location-usage-list/location-usage-list.component';
import { LocationsCreateViewModifyComponent } from './locations-create-view-modify/locations-create-view-modify.component';

// export each page component individually
export * from './locations-list/locations-list.component';
export * from './location-usage-list/location-usage-list.component';
export * from './locations-create-view-modify/locations-create-view-modify.component';

// export the list of all page components
export const pageComponents: any[] = [
  LocationsCreateViewModifyComponent,
  LocationsListComponent,
  LocationUsageListComponent
];
