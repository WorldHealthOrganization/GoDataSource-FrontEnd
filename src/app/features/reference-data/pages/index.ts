// import each page component
import { ReferenceDataCategoriesListComponent } from './reference-data-categories-list/reference-data-categories-list.component';
import { ReferenceDataCategoryEntriesListComponent } from './reference-data-category-entries-list/reference-data-category-entries-list.component';
import { ManageIconsListComponent } from './manage-icons-list/manage-icons-list.component';
import { ManageIconsCreateComponent } from './manage-icons-create/manage-icons-create.component';
import { ReferenceDataCategoryEntriesCreateViewModifyComponent } from './reference-data-category-entries-create-view-modify/reference-data-category-entries-create-view-modify.component';

// export each page component individually
export * from './reference-data-categories-list/reference-data-categories-list.component';
export * from './reference-data-category-entries-create-view-modify/reference-data-category-entries-create-view-modify.component';
export * from './reference-data-category-entries-list/reference-data-category-entries-list.component';
export * from './manage-icons-list/manage-icons-list.component';
export * from './manage-icons-create/manage-icons-create.component';

// export the list of all page components
export const pageComponents: any[] = [
  ReferenceDataCategoriesListComponent,
  ReferenceDataCategoryEntriesCreateViewModifyComponent,
  ReferenceDataCategoryEntriesListComponent,

  ManageIconsListComponent,
  ManageIconsCreateComponent
];
