import { ModuleWithProviders } from '@angular/core';
import { Route, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import * as fromPages from './pages';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { SelectedHelpCategoryDataResolver } from '../../core/services/resolvers/data/selected-help-category.resolver';
import { HelpCategoryDataResolver } from '../../core/services/resolvers/data/help-category.resolver';

// create / view / modify
const createViewModifyFoundationHelpCategory: Route = {
  component: fromPages.HelpCategoryCreateViewModifyComponent,
  canActivate: [AuthGuard],
  resolve: {
    user: UserDataResolver
  }
};

const createViewModifyFoundationHelpItem: Route = {
  component: fromPages.HelpItemCreateViewModifyComponent,
  canActivate: [AuthGuard],
  resolve: {
    user: UserDataResolver,
    category: SelectedHelpCategoryDataResolver,
    helpCategories: HelpCategoryDataResolver
  }
};

// routes
const routes: Routes = [
  // Help view / search
  {
    path: '',
    component: fromPages.HelpSearchComponent,
    canActivate: [AuthGuard],
    // NO permissions required, only to be authenticated
    resolve: {
      yesNoAll: YesNoAllDataResolver,
      helpCategory: HelpCategoryDataResolver
    }
  },
  // Help view single item
  {
    path: 'categories/:categoryId/items/:itemId/view-global',
    component: fromPages.ViewHelpComponent,
    canActivate: [AuthGuard],
    data: {
      // NO permissions required, only to be authenticated
      action: CreateViewModifyV2Action.VIEW
    },
    resolve:
    {
      helpCategory: HelpCategoryDataResolver
    }
  },
  // Help categories list
  {
    path: 'categories',
    component: fromPages.HelpCategoriesListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.HELP_CATEGORY_LIST
      ]
    },
    resolve: {
      yesNoAll: YesNoAllDataResolver
    }
  },
  // Create Help Category
  {
    path: 'categories/create',
    ...createViewModifyFoundationHelpCategory,
    data: {
      permissions: [
        PERMISSION.HELP_CATEGORY_CREATE
      ],
      action: CreateViewModifyV2Action.CREATE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Help Category
  {
    path: 'categories/:categoryId/view',
    ...createViewModifyFoundationHelpCategory,
    data: {
      permissions: [
        PERMISSION.HELP_CATEGORY_VIEW
      ],
      action: CreateViewModifyV2Action.VIEW
    }
  },
  // Modify Help Category
  {
    path: 'categories/:categoryId/modify',
    ...createViewModifyFoundationHelpCategory,
    data: {
      permissions: [
        PERMISSION.HELP_CATEGORY_MODIFY
      ],
      action: CreateViewModifyV2Action.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // Help categories list
  {
    path: 'categories/:categoryId/items',
    component: fromPages.HelpItemsListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.HELP_CATEGORY_ITEM_LIST
      ]
    },
    resolve: {
      yesNoAll: YesNoAllDataResolver,
      user: UserDataResolver,
      selectedCategory: SelectedHelpCategoryDataResolver
    }
  },
  // Create Help Item
  {
    path: 'categories/:categoryId/items/create',
    ...createViewModifyFoundationHelpItem,
    data: {
      permissions: [
        PERMISSION.HELP_CATEGORY_ITEM_CREATE
      ],
      action: CreateViewModifyV2Action.CREATE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Help Item
  {
    path: 'categories/:categoryId/items/:itemId/view',
    ...createViewModifyFoundationHelpItem,
    data: {
      permissions: [
        PERMISSION.HELP_CATEGORY_ITEM_VIEW
      ],
      action: CreateViewModifyV2Action.VIEW
    }
  },
  // Modify Help Item
  {
    path: 'categories/:categoryId/items/:itemId/modify',
    ...createViewModifyFoundationHelpItem,
    data: {
      permissions: [
        PERMISSION.HELP_CATEGORY_ITEM_MODIFY
      ],
      action: CreateViewModifyV2Action.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  }

];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
