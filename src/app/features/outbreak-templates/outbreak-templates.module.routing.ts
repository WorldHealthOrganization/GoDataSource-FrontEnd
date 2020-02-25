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
        component: fromPages.OutbreakTemplatesListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.OUTBREAK_TEMPLATE_LIST
            ]
        }
    },
    // create outbreak template
    {
        path: 'create',
        component: fromPages.CreateOutbreakTemplateComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.OUTBREAK_TEMPLATE_CREATE
            ]
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
            permissions: [
                PERMISSION.OUTBREAK_TEMPLATE_VIEW
            ],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // modify outbreak template
    {
        path: ':outbreakTemplateId/modify',
        component: fromPages.ModifyOutbreakTemplateComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.OUTBREAK_TEMPLATE_VIEW,
                PERMISSION.OUTBREAK_TEMPLATE_MODIFY
            ],
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
            permissions: [
                PERMISSION.OUTBREAK_TEMPLATE_VIEW,
                PERMISSION.OUTBREAK_TEMPLATE_MODIFY,
                PERMISSION.OUTBREAK_TEMPLATE_MODIFY_CASE_QUESTIONNAIRE
            ],
            questionnaire: OutbreakQestionnaireTypeEnum.CASE
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },

    // Edit Outbreak Template Case Questionnaire
    // to change in contact
    {
        path: ':outbreakTemplateId/contact-questionnaire',
        component: fromPages.OutbreakTemplateQuestionnaireComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.OUTBREAK_TEMPLATE_VIEW,
                PERMISSION.OUTBREAK_TEMPLATE_MODIFY,
                PERMISSION.OUTBREAK_TEMPLATE_MODIFY_CONTACT_QUESTIONNAIRE
            ],
            questionnaire: OutbreakQestionnaireTypeEnum.CONTACT
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
            permissions: [
                PERMISSION.OUTBREAK_TEMPLATE_VIEW,
                PERMISSION.OUTBREAK_TEMPLATE_MODIFY,
                PERMISSION.OUTBREAK_TEMPLATE_MODIFY_CONTACT_FOLLOW_UP_QUESTIONNAIRE
            ],
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
            permissions: [
                PERMISSION.OUTBREAK_TEMPLATE_VIEW,
                PERMISSION.OUTBREAK_TEMPLATE_MODIFY,
                PERMISSION.OUTBREAK_TEMPLATE_MODIFY_CASE_LAB_RESULT_QUESTIONNAIRE
            ],
            questionnaire: OutbreakQestionnaireTypeEnum.CASE_LAB_RESULT
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
