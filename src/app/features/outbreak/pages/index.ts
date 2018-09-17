// import each page component
import { OutbreakListComponent } from './outbreak-list/outbreak-list.component';
import { CreateOutbreakComponent } from './create-outbreak/create-outbreak.component';
import { ModifyOutbreakComponent } from './modify-outbreak/modify-outbreak.component';
import { FormQuestionListComponent } from '../components/form-question-list/form-question-list.component';
import { FormAnswerListComponent } from '../components/form-answer-list/form-answer-list.component';
import { FormSubQuestionListComponent } from '../components/form-sub-question-list/form-sub-question-list.component';
import { FormSubAnswerListComponent } from '../components/form-sub-answer-list/form-sub-answer-list.component';

// export each page component individually
export * from './outbreak-list/outbreak-list.component';
export * from './create-outbreak/create-outbreak.component';
export * from './modify-outbreak/modify-outbreak.component';
export * from '../components/form-answer-list/form-answer-list.component';
export * from '../components/form-question-list/form-question-list.component';
export * from '../components/form-sub-question-list/form-sub-question-list.component';
export * from '../components/form-sub-answer-list/form-sub-answer-list.component';

// export the list of all page components
export const pageComponents: any[] = [
    CreateOutbreakComponent,
    ModifyOutbreakComponent,
    OutbreakListComponent,
    FormQuestionListComponent,
    FormAnswerListComponent,

    // needed for fixing circular dependencies
    FormSubQuestionListComponent,
    FormSubAnswerListComponent
];
