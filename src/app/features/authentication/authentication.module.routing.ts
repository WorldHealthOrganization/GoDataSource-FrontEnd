import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';

const routes: Routes = [
    {
        path: 'login',
        component: fromPages.LoginComponent
    },
    {
        path: 'logout',
        component: fromPages.LogoutComponent
    },
    {
        path: 'forgot-password',
        component: fromPages.ForgotPasswordComponent
    },
    {
        path: 'reset-password',
        component: fromPages.ResetPasswordComponent
    },
    {
        path: 'reset-password-questions',
        component: fromPages.ResetPasswordQuestionsComponent
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
