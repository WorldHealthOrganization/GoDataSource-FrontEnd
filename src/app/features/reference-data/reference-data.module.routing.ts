import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule, Route } from '@angular/router';
import * as fromPages from './pages';
import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { ReferenceDataCategoryDataResolver } from '../../core/services/resolvers/data/reference-data-category.resolver';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { IconDataResolver } from '../../core/services/resolvers/data/icon.resolver';
import { ReferenceDataDiseaseSpecificCategoriesResolver } from '../../core/services/resolvers/data/reference-data-disease-specific-categories.resolver';
import { CreatedOnResolver } from '../../core/services/resolvers/data/created-on.resolver';
import { DeletedUserDataResolver } from '../../core/services/resolvers/data/deleted-user.resolver';

// common base - create / view / modify
const createViewModifyFoundation: Route = {
  component: fromPages.ReferenceDataCategoryEntriesCreateViewModifyComponent,
  canActivate: [AuthGuard],
  resolve: {
    category: ReferenceDataCategoryDataResolver,
    diseaseSpecificCategories: ReferenceDataDiseaseSpecificCategoriesResolver,
    user: UserDataResolver,
    deletedUser: DeletedUserDataResolver,
    icon: IconDataResolver
  }
};

// routes
const routes: Routes = [
  // Reference Data Categories List
  {
    path: '',
    component: fromPages.ReferenceDataCategoriesListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.REFERENCE_DATA_LIST
      ],
      diseaseSpecificCategoriesConf: {
        excludeEntries: true
      }
    },
    resolve: {
      yesNoAll: YesNoAllDataResolver,
      diseaseSpecificCategories: ReferenceDataDiseaseSpecificCategoriesResolver
    }
  },
  // View Reference Data Category Entries List
  {
    path: ':categoryId',
    component: fromPages.ReferenceDataCategoryEntriesListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.REFERENCE_DATA_CATEGORY_ITEM_LIST
      ],
      diseaseSpecificCategoriesConf: {
        excludeEntries: true
      }
    },
    resolve: {
      createdOn: CreatedOnResolver,
      yesNoAll: YesNoAllDataResolver,
      user: UserDataResolver,
      category: ReferenceDataCategoryDataResolver,
      diseaseSpecificCategories: ReferenceDataDiseaseSpecificCategoriesResolver
    }
  },
  // Create new Reference Data entry
  {
    path: ':categoryId/create',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.REFERENCE_DATA_CATEGORY_ITEM_CREATE
      ],
      action: CreateViewModifyV2Action.CREATE
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },
  // View Reference Data Entry
  {
    path: ':categoryId/:entryId/view',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.REFERENCE_DATA_CATEGORY_ITEM_VIEW
      ],
      action: CreateViewModifyV2Action.VIEW
    }
  },
  // Modify Reference Data entry
  {
    path: ':categoryId/:entryId/modify',
    ...createViewModifyFoundation,
    data: {
      permissions: [
        PERMISSION.REFERENCE_DATA_CATEGORY_ITEM_MODIFY
      ],
      action: CreateViewModifyV2Action.MODIFY
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ]
  },

  // Manage Icons - List
  {
    path: 'manage-icons/list',
    component: fromPages.ManageIconsListComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.ICON_LIST
      ]
    },
    resolve: {
      createdOn: CreatedOnResolver,
      yesNoAll: YesNoAllDataResolver,
      category: ReferenceDataCategoryDataResolver,
      user: UserDataResolver
    }
  },
  // Manage Icons - Create
  {
    path: 'manage-icons/add',
    component: fromPages.ManageIconsCreateComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.ICON_CREATE
      ]
    },
    canDeactivate: [
      PageChangeConfirmationGuard
    ],
    resolve: {
      category: ReferenceDataCategoryDataResolver
    }
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
