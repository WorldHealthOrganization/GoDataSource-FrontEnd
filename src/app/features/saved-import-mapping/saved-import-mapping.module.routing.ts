import { RouterModule, Routes } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PermissionExpression } from '../../core/models/user.model';
import { PERMISSION } from '../../core/models/permission.model';
import { ModuleWithProviders } from '@angular/core';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { CreatedOnResolver } from '../../core/services/resolvers/data/created-on.resolver';

const routes: Routes = [
  {
    path: '',
    component: fromPages.SavedImportMappingComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: new PermissionExpression({
        or: [
          PERMISSION.SYSTEM_SETTINGS_MODIFY_SAVED_IMPORT,
          PERMISSION.SYSTEM_SETTINGS_DELETE_SAVED_IMPORT,
          PERMISSION.LOCATION_IMPORT,
          PERMISSION.REFERENCE_DATA_IMPORT,
          PERMISSION.CONTACT_IMPORT,
          PERMISSION.CONTACT_IMPORT_LAB_RESULT,
          PERMISSION.CASE_IMPORT,
          PERMISSION.CASE_IMPORT_LAB_RESULT
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

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
