import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import * as fromPages from './pages';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { DiseaseDataResolver } from '../../core/services/resolvers/data/disease.resolver';
import { FollowUpGenerationTeamAssignmentAlgorithmDataResolver } from '../../core/services/resolvers/data/follow-up-generation-team-assignment-algorithm.resolver';
import { YesNoDataResolver } from '../../core/services/resolvers/data/yes-no.resolver';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';

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
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
