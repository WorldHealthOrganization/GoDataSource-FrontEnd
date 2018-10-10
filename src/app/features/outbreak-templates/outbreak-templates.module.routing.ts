import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';

import * as fromPages from './pages';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';

const routes: Routes = [
    // outbreak templates list
    {
        path: '',
        component: fromPages.OutbreakTemplatesListComponent
    },
    // create outbreak template
    {
        path: 'create',
        component: fromPages.CreateOutbreakTemplateComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_SYS_CONFIG],
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // view outbreak template
    {
        path: ':outbreakTemplateId/view',
        component: fromPages.ModifyOutbreakTemplateComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_SYS_CONFIG],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // modify outbreak template
    {
        path: ':outbreakTemplateId/modify',
        component: fromPages.ModifyOutbreakTemplateComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_SYS_CONFIG],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
