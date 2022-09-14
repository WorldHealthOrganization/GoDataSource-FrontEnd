import { OutbreakTemplatesListComponent } from './outbreak-templates-list/outbreak-templates-list.component';
import {
  OutbreakTemplateCreateViewModifyComponent
} from './outbreak-template-create-view-modify/outbreak-template-create-view-modify.component';

// export each page component individually
export * from './outbreak-templates-list/outbreak-templates-list.component';
export * from './outbreak-template-create-view-modify/outbreak-template-create-view-modify.component';

// export the list of all page components
export const pageComponents: any[] = [
  OutbreakTemplatesListComponent,
  OutbreakTemplateCreateViewModifyComponent
];
