import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import * as fromPages from './pages';

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
      yesNoAll: YesNoAllDataResolver
    }
  },
  // Create Event
  {
    path: 'create',
    component: fromPages.CreateEventComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.EVENT_CREATE
      ]
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Event
  {
    path: ':eventId/view',
    component: fromPages.ModifyEventComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.EVENT_VIEW
      ],
      action: ViewModifyComponentAction.VIEW
    }
  },
  // Modify Event
  {
    path: ':eventId/modify',
    component: fromPages.ModifyEventComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.OUTBREAK_VIEW,
        PERMISSION.EVENT_VIEW,
        PERMISSION.EVENT_MODIFY
      ],
      action: ViewModifyComponentAction.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
