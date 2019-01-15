import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { OutbreakResolver } from './services/outbreak-resolver';
import { OutbreakQestionnaireTypeEnum } from '../../core/enums/outbreak-qestionnaire-type.enum';

const routes: Routes = [
    // Outbreaks list
    {
        path: '',
        component: fromPages.OutbreakListComponent
    },
    // Create Outbreak
    {
        path: 'create',
        component: fromPages.CreateOutbreakComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_OUTBREAK]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View Outbreak
    {
        path: ':outbreakId/view',
        component: fromPages.ModifyOutbreakComponent,
        resolve: {
            outbreak: OutbreakResolver
        },
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_OUTBREAK],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Edit Outbreak
    {
        path: ':outbreakId/modify',
        component: fromPages.ModifyOutbreakComponent,
        resolve: {
            outbreak: OutbreakResolver
        },
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.WRITE_OUTBREAK],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },

    // Edit Outbreak Case Questionnaire
    {
        path: ':outbreakId/case-questionnaire',
        component: fromPages.OutbreakQuestionnaireComponent,
        resolve: {
            outbreak: OutbreakResolver
        },
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_OUTBREAK],
            questionnaire: OutbreakQestionnaireTypeEnum.CASE
        }
    },

    // Edit Outbreak Contact Follow-up Questionnaire
    {
        path: ':outbreakId/contact-follow-up-questionnaire',
        component: fromPages.OutbreakQuestionnaireComponent,
        resolve: {
            outbreak: OutbreakResolver
        },
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_OUTBREAK],
            questionnaire: OutbreakQestionnaireTypeEnum.FOLLOW_UP
        }
    },

    // Edit Outbreak Case Lab Results Questionnaire
    {
        path: ':outbreakId/case-lab-results-questionnaire',
        component: fromPages.OutbreakQuestionnaireComponent,
        resolve: {
            outbreak: OutbreakResolver
        },
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_OUTBREAK],
            questionnaire: OutbreakQestionnaireTypeEnum.CASE_LAB_RESULT
        }
    },

    // Inconsistencies
    {
        path: ':outbreakId/inconsistencies',
        component: fromPages.InconsistenciesListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_OUTBREAK]
        }
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
