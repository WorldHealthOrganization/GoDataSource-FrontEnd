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
  QuestionnaireAnswerTypeDataResolver
} from '../../core/services/resolvers/data/questionnaire-answer-type.resolver';
import {
  QuestionnaireQuestionCategoryDataResolver
} from '../../core/services/resolvers/data/questionnaire-question-category.resolver';
import {
  QuestionnaireAnswerDisplayDataResolver
} from '../../core/services/resolvers/data/questionnaire-answer-display.resolver';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import {
  ReferenceDataDiseaseSpecificCategoriesResolver
} from '../../core/services/resolvers/data/reference-data-disease-specific-categories.resolver';
import { IconDataResolver } from '../../core/services/resolvers/data/icon.resolver';
import { CreatedOnResolver } from '../../core/services/resolvers/data/created-on.resolver';
import { DeletedUserDataResolver } from '../../core/services/resolvers/data/deleted-user.resolver';

// conf
const createViewModifyFoundation: Route = {
  component: fromPages.OutbreakTemplateCreateViewModifyComponent,
  canActivate: [AuthGuard],
  resolve: {
    createdOn: CreatedOnResolver,
    disease: DiseaseDataResolver,
    followUpGenerationTeamAssignmentAlgorithm: FollowUpGenerationTeamAssignmentAlgorithmDataResolver,
    yesNo: YesNoDataResolver,
    questionnaireAnswerType: QuestionnaireAnswerTypeDataResolver,
    questionnaireQuestionCategory: QuestionnaireQuestionCategoryDataResolver,
    questionnaireAnswerDisplay: QuestionnaireAnswerDisplayDataResolver,
    user: UserDataResolver,
    deletedUser: DeletedUserDataResolver,
    diseaseSpecificCategories: ReferenceDataDiseaseSpecificCategoriesResolver,
    icon: IconDataResolver
  }
};

// routes
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
      createdOn: CreatedOnResolver,
      disease: DiseaseDataResolver,
      followUpGenerationTeamAssignmentAlgorithm: FollowUpGenerationTeamAssignmentAlgorithmDataResolver,
      yesNo: YesNoDataResolver,
      yesNoAll: YesNoAllDataResolver,
      user: UserDataResolver
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
