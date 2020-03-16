import { RouterModule, Routes } from '@angular/router';
import * as fromPages from './pages';
import { ModuleWithProviders } from '@angular/compiler/src/core';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PermissionExpression } from '../../core/models/user.model';
import { PERMISSION } from '../../core/models/permission.model';

const routes: Routes = [
    {
        path: '',
        component: fromPages.SavedImportMappingComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: new PermissionExpression({
                or: [
                    PERMISSION.LOCATION_IMPORT,
                    PERMISSION.REFERENCE_DATA_IMPORT,
                    PERMISSION.CONTACT_IMPORT,
                    PERMISSION.CONTACT_IMPORT_LAB_RESULT,
                    PERMISSION.CASE_IMPORT,
                    PERMISSION.CASE_IMPORT_LAB_RESULT
                ]
            })
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
