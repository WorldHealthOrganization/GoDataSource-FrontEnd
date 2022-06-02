// import each page component
import { OutbreakListComponent } from './outbreak-list/outbreak-list.component';
import { InconsistenciesListComponent } from './inconsistencies-list/inconsistencies-list.component';
import { SearchResultListComponent } from './search-result-list/search-result-list.component';
import { OutbreakCreateViewModifyComponent } from './outbreak-create-view-modify/outbreak-create-view-modify.component';

// export each page component individually
export * from './outbreak-create-view-modify/outbreak-create-view-modify.component';
export * from './outbreak-list/outbreak-list.component';
export * from './inconsistencies-list/inconsistencies-list.component';
export * from './search-result-list/search-result-list.component';

// export the list of all page components
export const pageComponents: any[] = [
  OutbreakCreateViewModifyComponent,
  OutbreakListComponent,
  InconsistenciesListComponent,
  SearchResultListComponent
];
