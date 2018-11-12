import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import * as fromPages from './pages';

const routes: Routes = [
    {
        path: 'change-password',
        component: fromPages.ChangePasswordComponent
    },
    {
        path: 'set-security-questions',
        component: fromPages.SetSecurityQuestionsComponent
    },
    {
        path: 'my-profile',
        component: fromPages.MyProfileComponent
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
