import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import * as fromPages from './pages';
import { VersionDataResolver } from '../../core/services/resolvers/data/version.resolver';
import { LanguageDataResolver } from '../../core/services/resolvers/data/language.resolver';

const routes: Routes = [
  {
    path: 'login',
    component: fromPages.LoginComponent,
    resolve: {
      version: VersionDataResolver,
      languages: LanguageDataResolver
    }
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

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
