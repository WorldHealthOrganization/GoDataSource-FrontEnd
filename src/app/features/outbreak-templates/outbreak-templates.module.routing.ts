import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import * as fromPages from './pages';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { OutbreakQestionnaireTypeEnum } from '../../core/enums/outbreak-qestionnaire-type.enum';

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
    },

    // Edit Outbreak Template Case Questionnaire
    {
        path: ':outbreakTemplateId/case-questionnaire',
        component: fromPages.OutbreakTemplateQuestionnaireComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_OUTBREAK],
            questionnaire: OutbreakQestionnaireTypeEnum.CASE
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },

    // Edit Outbreak Template Contact Follow-up Questionnaire
    {
        path: ':outbreakTemplateId/contact-follow-up-questionnaire',
        component: fromPages.OutbreakTemplateQuestionnaireComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_OUTBREAK],
            questionnaire: OutbreakQestionnaireTypeEnum.FOLLOW_UP
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },

    // Edit Outbreak Template Case Lab Results Questionnaire
    {
        path: ':outbreakTemplateId/case-lab-results-questionnaire',
        component: fromPages.OutbreakTemplateQuestionnaireComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [PERMISSION.READ_OUTBREAK],
            questionnaire: OutbreakQestionnaireTypeEnum.CASE_LAB_RESULT
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
