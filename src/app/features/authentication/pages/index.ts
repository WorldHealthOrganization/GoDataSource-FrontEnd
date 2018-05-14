// import each page component
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';

// export each page component individually
export * from './login/login.component';
export * from './logout/logout.component';

// export the list of all page components
export const pageComponents: any[] = [
    LoginComponent,
    LogoutComponent,
];
