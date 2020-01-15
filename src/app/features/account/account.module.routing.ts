import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';

const routes: Routes = [
    {
        path: 'change-password',
        component: fromPages.ChangePasswordComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.USER_MODIFY_OWN_ACCOUNT
            ]
        }
    },
    {
        path: 'set-security-questions',
        component: fromPages.SetSecurityQuestionsComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.USER_MODIFY_OWN_ACCOUNT
            ]
        }
    },
    {
        path: 'my-profile',
        component: fromPages.MyProfileComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.USER_MODIFY_OWN_ACCOUNT
            ]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
