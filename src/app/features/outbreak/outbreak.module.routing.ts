import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule, Route } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { OutbreakQestionnaireTypeEnum } from '../../core/enums/outbreak-qestionnaire-type.enum';
import { PermissionExpression } from '../../core/models/user.model';
import { DiseaseDataResolver } from '../../core/services/resolvers/data/disease.resolver';
import { CountryDataResolver } from '../../core/services/resolvers/data/country.resolver';
import { LocationGeographicalLevelDataResolver } from '../../core/services/resolvers/data/location-geographical-level.resolver';
import { YesNoDataResolver } from '../../core/services/resolvers/data/yes-no.resolver';
import { FollowUpGenerationTeamAssignmentAlgorithmDataResolver } from '../../core/services/resolvers/data/follow-up-generation-team-assignment-algorithm.resolver';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { PersonTypeDataResolver } from '../../core/services/resolvers/data/person-type.resolver';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { MapVectorTypeDataResolver } from '../../core/services/resolvers/data/map-vector-type.resolver';
import { OutbreakTemplateDataResolver } from '../../core/services/resolvers/data/outbreak-template.resolver';

// common base - create / view / modify
const createViewModifyFoundation: Route = {
  component: fromPages.OutbreakCreateViewModifyComponent,
  canActivate: [AuthGuard],
  resolve: {
    disease: DiseaseDataResolver,
    country: CountryDataResolver,
    geographicalLevel: LocationGeographicalLevelDataResolver,
    followUpGenerationTeamAssignmentAlgorithm: FollowUpGenerationTeamAssignmentAlgorithmDataResolver,
    yesNo: YesNoDataResolver,
    mapVectorType: MapVectorTypeDataResolver,
    user: UserDataResolver,
    outbreakTemplate: OutbreakTemplateDataResolver
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
      disease: DiseaseDataResolver,
      country: CountryDataResolver,
      geographicalLevel: LocationGeographicalLevelDataResolver,
      yesNo: YesNoDataResolver,
      yesNoAll: YesNoAllDataResolver,
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

  // Edit Outbreak Case Questionnaire
  {
    path: ':outbreakId/case-questionnaire',
    component: fromPages.OutbreakQuestionnaireComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.OUTBREAK_MODIFY,
        PERMISSION.OUTBREAK_MODIFY_CASE_QUESTIONNAIRE
      ],
      questionnaire: OutbreakQestionnaireTypeEnum.CASE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },

  // Edit Outbreak Contact Questionnaire
  {
    path: ':outbreakId/contact-questionnaire',
    component: fromPages.OutbreakQuestionnaireComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.OUTBREAK_MODIFY,
        PERMISSION.OUTBREAK_MODIFY_CONTACT_QUESTIONNAIRE
      ],
      questionnaire: OutbreakQestionnaireTypeEnum.CONTACT
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },

  // Edit Outbreak Contact Follow-up Questionnaire
  {
    path: ':outbreakId/contact-follow-up-questionnaire',
    component: fromPages.OutbreakQuestionnaireComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.OUTBREAK_MODIFY,
        PERMISSION.OUTBREAK_MODIFY_CONTACT_FOLLOW_UP_QUESTIONNAIRE
      ],
      questionnaire: OutbreakQestionnaireTypeEnum.FOLLOW_UP
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },

  // Edit Outbreak Case Lab Results Questionnaire
  {
    path: ':outbreakId/case-lab-results-questionnaire',
    component: fromPages.OutbreakQuestionnaireComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.OUTBREAK_MODIFY,
        PERMISSION.OUTBREAK_MODIFY_CASE_LAB_RESULT_QUESTIONNAIRE
      ],
      questionnaire: OutbreakQestionnaireTypeEnum.CASE_LAB_RESULT
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
