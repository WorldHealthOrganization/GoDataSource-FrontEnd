// import each page component
import { ChangePasswordComponent } from './change-password/change-password.component';
import { SetSecurityQuestionsComponent } from './set-security-questions/set-security-questions.component';
import { MyProfileComponent } from './my-profile/my-profile.component';

// export each page component individually
export * from './change-password/change-password.component';
export * from './set-security-questions/set-security-questions.component';
export * from './my-profile/my-profile.component';

// export the list of all page components
export const pageComponents: any[] = [
    ChangePasswordComponent,
    SetSecurityQuestionsComponent,
    MyProfileComponent
];
