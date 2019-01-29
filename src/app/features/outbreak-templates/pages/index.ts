import { OutbreakTemplatesListComponent } from './outbreak-templates-list/outbreak-templates-list.component';
import { CreateOutbreakTemplateComponent } from './create-outbreak-template/create-outbreak-template.component';
import { ModifyOutbreakTemplateComponent } from './modify-outbreak-template/modify-outbreak-template.component';
import { OutbreakTemplateQuestionnaireComponent } from './outbreak-template-questionnaire/outbreak-template-questionnaire.component';

// export each page component individually
export * from './outbreak-templates-list/outbreak-templates-list.component';
export * from './create-outbreak-template/create-outbreak-template.component';
export * from './modify-outbreak-template/modify-outbreak-template.component';
export * from './outbreak-template-questionnaire/outbreak-template-questionnaire.component';

// export the list of all page components
export const pageComponents: any[] = [
    OutbreakTemplatesListComponent,
    CreateOutbreakTemplateComponent,
    ModifyOutbreakTemplateComponent,
    OutbreakTemplateQuestionnaireComponent
];
