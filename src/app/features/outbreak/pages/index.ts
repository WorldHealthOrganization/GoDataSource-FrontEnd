// import each page component
import { OutbreakListComponent } from './outbreak-list/outbreak-list.component';
import { CreateOutbreakComponent } from './create-outbreak/create-outbreak.component';
import { ModifyOutbreakComponent } from './modify-outbreak/modify-outbreak.component';
import { QuestionComponent } from '../components/question/question.component';
import { AnswerComponent } from '../components/answer/answer.component';
import { OutbreakDialogComponent } from '../components/outbreak-dialog/outbreak-dialog.component';

// export each page component individually
export * from './outbreak-list/outbreak-list.component';
export * from './create-outbreak/create-outbreak.component';
export * from './modify-outbreak/modify-outbreak.component';
export * from '../components/question/question.component';
export * from '../components/answer/answer.component';
export * from '../components/outbreak-dialog/outbreak-dialog.component';

// export the list of all page components
export const pageComponents: any[] = [
    CreateOutbreakComponent,
    ModifyOutbreakComponent,
    OutbreakListComponent,
    QuestionComponent,
    AnswerComponent,
    OutbreakDialogComponent
];
