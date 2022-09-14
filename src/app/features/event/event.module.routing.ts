import { ModuleWithProviders } from '@angular/core';
import { Route, RouterModule, Routes } from '@angular/router';
import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import * as fromPages from './pages';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { AddressTypeDataResolver } from '../../core/services/resolvers/data/address-type.resolver';
import { SelectedOutbreakDataResolver } from '../../core/services/resolvers/data/selected-outbreak.resolver';
import { PersonTypeDataResolver } from '../../core/services/resolvers/data/person-type.resolver';
import { ClusterDataResolver } from '../../core/services/resolvers/data/cluster.resolver';
import { ExposureTypeDataResolver } from '../../core/services/resolvers/data/exposure-type.resolver';
import { ExposureFrequencyDataResolver } from '../../core/services/resolvers/data/exposure-frequency.resolver';
import { ExposureDurationDataResolver } from '../../core/services/resolvers/data/exposure-duration.resolver';
import { ContextOfTransmissionDataResolver } from '../../core/services/resolvers/data/context-of-transmission.resolver';
import { CertaintyLevelDataResolver } from '../../core/services/resolvers/data/certainty-level.resolver';
import { EventCategoryDataResolver } from '../../core/services/resolvers/data/event-category.resolver';

// common base - create / view / modify
const createViewModifyFoundation: Route = {
  component: fromPages.EventsCreateViewModifyComponent,
  canActivate: [AuthGuard],
  resolve: {
    user: UserDataResolver,
    addressType: AddressTypeDataResolver,
    outbreak: SelectedOutbreakDataResolver,
    personType: PersonTypeDataResolver,
    cluster: ClusterDataResolver,
    certaintyLevel: CertaintyLevelDataResolver,
    exposureType: ExposureTypeDataResolver,
    exposureFrequency: ExposureFrequencyDataResolver,
    exposureDuration: ExposureDurationDataResolver,
    contextOfTransmission: ContextOfTransmissionDataResolver,
    yesNoAll: YesNoAllDataResolver,
    eventCategory: EventCategoryDataResolver
  }
};

const routes: Routes = [
  // Events list
  {
    path: '',
    component: fromPages.EventsListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.EVENT_LIST
      ]
    },
    resolve: {
      user: UserDataResolver,
      yesNoAll: YesNoAllDataResolver,
      eventCategory: EventCategoryDataResolver
    }
  },
  // Create Event
  {
    path: 'create',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.EVENT_CREATE
      ],
      action: CreateViewModifyV2Action.CREATE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Event
  {
    path: ':eventId/view',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.EVENT_VIEW
      ],
      action: CreateViewModifyV2Action.VIEW
    }
  },
  // Modify Event
  {
    path: ':eventId/modify',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.EVENT_VIEW,
        PERMISSION.EVENT_MODIFY
      ],
      action: CreateViewModifyV2Action.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
