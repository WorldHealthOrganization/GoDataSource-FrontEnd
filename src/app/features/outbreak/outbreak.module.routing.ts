import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule, Route } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { PermissionExpression } from '../../core/models/user.model';
import { DiseaseDataResolver } from '../../core/services/resolvers/data/disease.resolver';
import { CountryDataResolver } from '../../core/services/resolvers/data/country.resolver';
import { LocationGeographicalLevelDataResolver } from '../../core/services/resolvers/data/location-geographical-level.resolver';
import { YesNoDataResolver } from '../../core/services/resolvers/data/yes-no.resolver';
import { FollowUpGenerationTeamAssignmentAlgorithmDataResolver } from '../../core/services/resolvers/data/follow-up-generation-team-assignment-algorithm.resolver';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { PersonTypeDataResolver } from '../../core/services/resolvers/data/person-type.resolver';
import { OutbreakDataResolver } from '../../core/services/resolvers/data/outbreak.resolver';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { MapVectorTypeDataResolver } from '../../core/services/resolvers/data/map-vector-type.resolver';
import { OutbreakTemplateDataResolver } from '../../core/services/resolvers/data/outbreak-template.resolver';
import { QuestionnaireAnswerTypeDataResolver } from '../../core/services/resolvers/data/questionnaire-answer-type.resolver';
import { QuestionnaireQuestionCategoryDataResolver } from '../../core/services/resolvers/data/questionnaire-question-category.resolver';
import { QuestionnaireAnswerDisplayDataResolver } from '../../core/services/resolvers/data/questionnaire-answer-display.resolver';
import {
  ReferenceDataDiseaseSpecificCategoriesResolver
} from '../../core/services/resolvers/data/reference-data-disease-specific-categories.resolver';
import { IconDataResolver } from '../../core/services/resolvers/data/icon.resolver';
import { CreatedOnResolver } from '../../core/services/resolvers/data/created-on.resolver';
import { DeletedUserDataResolver } from '../../core/services/resolvers/data/deleted-user.resolver';

// common base - create / view / modify
const createViewModifyFoundation: Route = {
  component: fromPages.OutbreakCreateViewModifyComponent,
  canActivate: [AuthGuard],
  resolve: {
    createdOn: CreatedOnResolver,
    disease: DiseaseDataResolver,
    country: CountryDataResolver,
    geographicalLevel: LocationGeographicalLevelDataResolver,
    followUpGenerationTeamAssignmentAlgorithm: FollowUpGenerationTeamAssignmentAlgorithmDataResolver,
    yesNoAll: YesNoAllDataResolver,
    yesNo: YesNoDataResolver,
    mapVectorType: MapVectorTypeDataResolver,
    user: UserDataResolver,
    deletedUser: DeletedUserDataResolver,
    outbreakTemplate: OutbreakTemplateDataResolver,
    questionnaireAnswerType: QuestionnaireAnswerTypeDataResolver,
    questionnaireQuestionCategory: QuestionnaireQuestionCategoryDataResolver,
    questionnaireAnswerDisplay: QuestionnaireAnswerDisplayDataResolver,
    diseaseSpecificCategories: ReferenceDataDiseaseSpecificCategoriesResolver,
    icon: IconDataResolver
  }
};

// routes
const routes: Routes = [
  // Outbreaks list
  {
    path: '',
    component: fromPages.OutbreakListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_LIST
      ]
    },
    resolve: {
      createdOn: CreatedOnResolver,
      disease: DiseaseDataResolver,
      country: CountryDataResolver,
      geographicalLevel: LocationGeographicalLevelDataResolver,
      yesNoAll: YesNoAllDataResolver,
      yesNo: YesNoDataResolver,
      followUpGenerationTeamAssignmentAlgorithm: FollowUpGenerationTeamAssignmentAlgorithmDataResolver,
      user: UserDataResolver
    }
  },
  // Create Outbreak
  {
    path: 'create',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        // list for checking if there is another outbreak with the same name
        PERMISSION.OUTBREAK_LIST,
        PERMISSION.OUTBREAK_CREATE
      ],
      action: CreateViewModifyV2Action.CREATE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Outbreak
  {
    path: ':outbreakId/view',
    ...createViewModifyFoundation,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW
      ],
      action: CreateViewModifyV2Action.VIEW
    }
  },
  // Edit Outbreak
  {
    path: ':outbreakId/modify',
    ...createViewModifyFoundation,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        // list for checking if there is another outbreak with the same name
        PERMISSION.OUTBREAK_LIST,
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.OUTBREAK_MODIFY
      ],
      action: CreateViewModifyV2Action.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },

  // Inconsistencies
  {
    path: ':outbreakId/inconsistencies',
    component: fromPages.InconsistenciesListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_SEE_INCONSISTENCIES
      ]
    },
    resolve: {
      yesNoAll: YesNoAllDataResolver,
      outbreak: OutbreakDataResolver,
      personType: PersonTypeDataResolver
    }
  },

  // Global entity search result
  {
    path: ':outbreakId/search-results',
    component: fromPages.SearchResultListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: new PermissionExpression({
        or: [
          PERMISSION.CASE_LIST,
          PERMISSION.CONTACT_LIST,
          PERMISSION.CONTACT_OF_CONTACT_LIST,
          PERMISSION.EVENT_LIST
        ]
      })
    },
    resolve: {
      yesNoAll: YesNoAllDataResolver,
      personType: PersonTypeDataResolver
    }
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
