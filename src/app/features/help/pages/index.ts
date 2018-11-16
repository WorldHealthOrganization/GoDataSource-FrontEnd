// import each page component
import { HelpCategoriesListComponent } from './help-categories-list/help-categories-list.component';
import { CreateHelpCategoryComponent } from './create-help-category/create-help-category.component';
import { ModifyHelpCategoryComponent } from './modify-help-category/modify-help-category.component';
import { HelpItemsListComponent } from './help-items-list/help-items-list.component';
import { CreateHelpItemComponent } from './create-help-item/create-help-item.component';
import { ModifyHelpItemComponent } from './modify-help-item/modify-help-item.component';
import { HelpSearchComponent } from './help-search/help-search.component';
import { ViewHelpComponent } from './view-help/view-help.component';

// export each page component individually
export * from './help-categories-list/help-categories-list.component';
export * from './create-help-category/create-help-category.component';
export * from './modify-help-category/modify-help-category.component';
export * from './help-items-list/help-items-list.component';
export * from './create-help-item/create-help-item.component';
export * from './modify-help-item/modify-help-item.component';
export * from './help-search/help-search.component';
export * from './view-help/view-help.component';

// export the list of all page components
export const pageComponents: any[] = [
    HelpCategoriesListComponent,
    CreateHelpCategoryComponent,
    ModifyHelpCategoryComponent,
    HelpItemsListComponent,
    CreateHelpItemComponent,
    ModifyHelpItemComponent,
    HelpSearchComponent,
    ViewHelpComponent
];
