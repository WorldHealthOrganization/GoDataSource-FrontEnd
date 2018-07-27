// import each page component
import { ReferenceDataCategoriesListComponent } from './reference-data-categories-list/reference-data-categories-list.component';
import { ReferenceDataCategoryEntriesListComponent } from './reference-data-category-entries-list/reference-data-category-entries-list.component';
import { CreateReferenceDataEntryComponent } from './create-reference-data-entry/create-reference-data-entry.component';
import { ModifyReferenceDataEntryComponent } from './modify-reference-data-entry/modify-reference-data-entry.component';

// export each page component individually
export * from './reference-data-categories-list/reference-data-categories-list.component';
export * from './reference-data-category-entries-list/reference-data-category-entries-list.component';
export * from './create-reference-data-entry/create-reference-data-entry.component';
export * from './modify-reference-data-entry/modify-reference-data-entry.component';

// export the list of all page components
export const pageComponents: any[] = [
    ReferenceDataCategoriesListComponent,
    ReferenceDataCategoryEntriesListComponent,
    CreateReferenceDataEntryComponent,
    ModifyReferenceDataEntryComponent
];