import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule, Route } from '@angular/router';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import * as fromPages from './pages';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { CreatedOnResolver } from '../../core/services/resolvers/data/created-on.resolver';
import { DeletedUserDataResolver } from '../../core/services/resolvers/data/deleted-user.resolver';

// create / view / modify
const createViewModifyFoundation: Route = {
  component: fromPages.LanguagesCreateViewModifyComponent,
  canActivate: [AuthGuard],
  resolve: {
    user: UserDataResolver,
    deletedUser: DeletedUserDataResolver
  }
};

// routes
const routes: Routes = [
  // Language list
  {
    path: '',
    component: fromPages.LanguagesListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.LANGUAGE_LIST
      ]
    },
    resolve: {
      createdOn: CreatedOnResolver,
      user: UserDataResolver,
      yesNoAll: YesNoAllDataResolver
    }
  },
  // Create Language
  {
    path: 'create',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.LANGUAGE_CREATE
      ],
      action: CreateViewModifyV2Action.CREATE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Language
  {
    path: ':languageId/view',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.LANGUAGE_VIEW
      ],
      action: CreateViewModifyV2Action.VIEW
    }
  },
  // Modify Language
  {
    path: ':languageId/modify',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.LANGUAGE_MODIFY
      ],
      action: CreateViewModifyV2Action.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
