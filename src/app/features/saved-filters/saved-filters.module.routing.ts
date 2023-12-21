import { RouterModule, Routes } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { PermissionExpression } from '../../core/models/user.model';
import { ModuleWithProviders } from '@angular/core';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { CreatedOnResolver } from '../../core/services/resolvers/data/created-on.resolver';

const routes: Routes = [
  {
    path: '',
    component: fromPages.SavedFiltersComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: new PermissionExpression({
        or: [
          PERMISSION.SYSTEM_SETTINGS_MODIFY_SAVED_FILTERS,
          PERMISSION.SYSTEM_SETTINGS_DELETE_SAVED_FILTERS,
          PERMISSION.CASE_LIST,
          PERMISSION.FOLLOW_UP_LIST,
          PERMISSION.CONTACT_LIST,
          PERMISSION.CASE_LIST_LAB_RESULT,
          PERMISSION.CONTACT_LIST_LAB_RESULT,
          PERMISSION.LAB_RESULT_LIST,
          PERMISSION.CASE_CHANGE_SOURCE_RELATIONSHIP,
          PERMISSION.CONTACT_CHANGE_SOURCE_RELATIONSHIP,
          PERMISSION.EVENT_CHANGE_SOURCE_RELATIONSHIP,
          PERMISSION.RELATIONSHIP_CREATE,
          PERMISSION.RELATIONSHIP_SHARE
        ]
      })
    },
    resolve: {
      createdOn: CreatedOnResolver,
      yesNoAll: YesNoAllDataResolver,
      user: UserDataResolver
    }
  }
];

export const routing: ModuleWithProviders<RouterModule> =  RouterModule.forChild(routes);
