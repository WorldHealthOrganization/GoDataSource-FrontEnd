// import each page component
import { LanguagesListComponent } from './languages-list/languages-list.component';
import { LanguagesCreateViewModifyComponent } from './languages-create-view-modify/languages-create-view-modify.component';

// export each page component individually
export * from './languages-list/languages-list.component';
export * from './languages-create-view-modify/languages-create-view-modify.component';

// export the list of all page components
export const pageComponents: any[] = [
  LanguagesCreateViewModifyComponent,
  LanguagesListComponent
];
