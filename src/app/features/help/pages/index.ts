// import each page component
import { HelpCategoriesListComponent } from './help-categories-list/help-categories-list.component';
import {
  HelpCategoryCreateViewModifyComponent
} from './help-category-create-view-modify/help-category-create-view-modify.component';
import { HelpItemsListComponent } from './help-items-list/help-items-list.component';
import {
  HelpItemCreateViewModifyComponent
} from './help-item-create-view-modify/help-item-create-view-modify.component';
import { HelpSearchComponent } from './help-search/help-search.component';
import { ViewHelpComponent } from './view-help/view-help.component';

// export each page component individually
export * from './help-categories-list/help-categories-list.component';
export * from './help-category-create-view-modify/help-category-create-view-modify.component';
export * from './help-items-list/help-items-list.component';
export * from './help-item-create-view-modify/help-item-create-view-modify.component';
export * from './help-search/help-search.component';
export * from './view-help/view-help.component';

// export the list of all page components
export const pageComponents: any[] = [
  HelpCategoriesListComponent,
  HelpCategoryCreateViewModifyComponent,
  HelpItemsListComponent,
  HelpItemCreateViewModifyComponent,
  HelpSearchComponent,
  ViewHelpComponent
];
