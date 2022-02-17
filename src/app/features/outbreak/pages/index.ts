// import each page component
import { OutbreakListComponent } from './outbreak-list/outbreak-list.component';
import { CreateOutbreakComponent } from './create-outbreak/create-outbreak.component';
import { ModifyOutbreakComponent } from './modify-outbreak/modify-outbreak.component';
import { InconsistenciesListComponent } from './inconsistencies-list/inconsistencies-list.component';
import { OutbreakQuestionnaireComponent } from './outbreak-questionnaire/outbreak-questionnaire.component';
import { SearchResultListComponent } from './search-result-list/search-result-list.component';

// export each page component individually
export * from './outbreak-list/outbreak-list.component';
export * from './create-outbreak/create-outbreak.component';
export * from './modify-outbreak/modify-outbreak.component';
export * from './inconsistencies-list/inconsistencies-list.component';
export * from './outbreak-questionnaire/outbreak-questionnaire.component';
export * from './search-result-list/search-result-list.component';

// export the list of all page components
export const pageComponents: any[] = [
  CreateOutbreakComponent,
  ModifyOutbreakComponent,
  OutbreakListComponent,
  OutbreakQuestionnaireComponent,

  InconsistenciesListComponent,
  SearchResultListComponent
];
