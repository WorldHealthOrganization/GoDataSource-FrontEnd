import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';

import * as fromPages from './pages';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';

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
        }
    },
    // Create Language
    {
        path: 'create',
        component: fromPages.CreateLanguageComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.LANGUAGE_CREATE
            ]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View Language
    {
        path: ':languageId/view',
        component: fromPages.ModifyLanguageComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.LANGUAGE_VIEW
            ],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Language
    {
        path: ':languageId/modify',
        component: fromPages.ModifyLanguageComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.LANGUAGE_MODIFY
            ],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
