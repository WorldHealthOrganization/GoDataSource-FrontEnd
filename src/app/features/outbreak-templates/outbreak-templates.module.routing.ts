import { ModuleWithProviders } from '@angular/core';
import { Route, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import * as fromPages from './pages';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { DiseaseDataResolver } from '../../core/services/resolvers/data/disease.resolver';
import {
  FollowUpGenerationTeamAssignmentAlgorithmDataResolver
} from '../../core/services/resolvers/data/follow-up-generation-team-assignment-algorithm.resolver';
import { YesNoDataResolver } from '../../core/services/resolvers/data/yes-no.resolver';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import {
  LocationGeographicalLevelDataResolver
} from '../../core/services/resolvers/data/location-geographical-level.resolver';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { OutbreakTemplateDataResolver } from '../../core/services/resolvers/data/outbreak-template.resolver';
import {
  QuestionnaireAnswerTypeDataResolver
} from '../../core/services/resolvers/data/questionnaire-answer-type.resolver';
import {
  QuestionnaireQuestionCategoryDataResolver
} from '../../core/services/resolvers/data/questionnaire-question-category.resolver';
import {
  QuestionnaireAnswerDisplayDataResolver
} from '../../core/services/resolvers/data/questionnaire-answer-display.resolver';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';

const createViewModifyFoundation: Route = {
  component: fromPages.OutbreakTemplateCreateViewModifyComponent,
  canActivate: [AuthGuard],
  resolve: {
    disease: DiseaseDataResolver,
    geographicalLevel: LocationGeographicalLevelDataResolver,
    followUpGenerationTeamAssignmentAlgorithm: FollowUpGenerationTeamAssignmentAlgorithmDataResolver,
    yesNo: YesNoDataResolver,
    user: UserDataResolver,
    outbreakTemplate: OutbreakTemplateDataResolver,
    questionnaireAnswerType: QuestionnaireAnswerTypeDataResolver,
    questionnaireQuestionCategory: QuestionnaireQuestionCategoryDataResolver,
    questionnaireAnswerDisplay: QuestionnaireAnswerDisplayDataResolver
  }
};

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
    },
    resolve: {
      disease: DiseaseDataResolver,
      followUpGenerationTeamAssignmentAlgorithm: FollowUpGenerationTeamAssignmentAlgorithmDataResolver,
      yesNo: YesNoDataResolver,
      yesNoAll: YesNoAllDataResolver
    }
  },
  // create outbreak template
  {
    path: 'create',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.OUTBREAK_TEMPLATE_CREATE
      ],
      action: CreateViewModifyV2Action.CREATE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // view outbreak template
  {
    path: ':outbreakTemplateId/view',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.OUTBREAK_TEMPLATE_VIEW
      ],
      action: CreateViewModifyV2Action.VIEW
    }
  },
  // modify outbreak template
  {
    path: ':outbreakTemplateId/modify',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.OUTBREAK_TEMPLATE_VIEW,
        PERMISSION.OUTBREAK_TEMPLATE_MODIFY
      ],
      action: CreateViewModifyV2Action.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
