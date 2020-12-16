// import each page component
import { LanguagesListComponent } from './languages-list/languages-list.component';
import { CreateLanguageComponent } from './create-language/create-language.component';
import { ModifyLanguageComponent } from './modify-language/modify-language.component';

// export each page component individually
export * from './languages-list/languages-list.component';
export * from './create-language/create-language.component';
export * from './modify-language/modify-language.component';

// export the list of all page components
export const pageComponents: any[] = [
    LanguagesListComponent,
    CreateLanguageComponent,
    ModifyLanguageComponent
];
