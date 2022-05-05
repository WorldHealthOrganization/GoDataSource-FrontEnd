import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import * as fromPages from './pages';
import { VersionDataResolver } from '../../core/services/resolvers/data/version.resolver';
import { LanguageDataResolver } from '../../core/services/resolvers/data/language.resolver';
import { CaptchaDataFor } from '../../core/services/data/captcha.data.service';

const routes: Routes = [
  {
    path: 'login',
    component: fromPages.LoginComponent,
    resolve: {
      version: VersionDataResolver,
      languages: LanguageDataResolver
    },
    data: {
      page: CaptchaDataFor.LOGIN
    }
  },
  {
    path: 'logout',
    component: fromPages.LogoutComponent
  },
  {
    path: 'forgot-password',
    component: fromPages.LoginComponent,
    resolve: {
      version: VersionDataResolver,
      languages: LanguageDataResolver
    },
    data: {
      page: CaptchaDataFor.FORGOT_PASSWORD
    }
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
