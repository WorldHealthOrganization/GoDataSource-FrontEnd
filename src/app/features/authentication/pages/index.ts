// import each page component
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ResetPasswordQuestionsComponent } from './reset-password-questions/reset-password-questions.component';

// export each page component individually
export * from './login/login.component';
export * from './logout/logout.component';
export * from './reset-password/reset-password.component';
export * from './reset-password-questions/reset-password-questions.component';

// export the list of all page components
export const pageComponents: any[] = [
  LoginComponent,
  LogoutComponent,
  ResetPasswordComponent,
  ResetPasswordQuestionsComponent
];
