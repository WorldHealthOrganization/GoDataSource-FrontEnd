import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule, Route } from '@angular/router';
import * as fromPages from './pages';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { PERMISSION } from '../../core/models/permission.model';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';
import { YesNoAllDataResolver } from '../../core/services/resolvers/data/yes-no-all.resolver';
import { UserDataResolver } from '../../core/services/resolvers/data/user.resolver';
import { BackupModuleDataResolver } from '../../core/services/resolvers/data/backup-module.resolver';
import { BackupStatusDataResolver } from '../../core/services/resolvers/data/backup-status.resolver';
import { YesNoDataResolver } from '../../core/services/resolvers/data/yes-no.resolver';
import { BackupTypesDataResolver } from '../../core/services/resolvers/data/backup-types.resolver';
import { OutbreakDataResolver } from '../../core/services/resolvers/data/outbreak.resolver';
import { SyncPackageStatusDataResolver } from '../../core/services/resolvers/data/sync-package-status.resolver';
import { SyncPackageModuleDataResolver } from '../../core/services/resolvers/data/sync-package-module.resolver';
import { SyncPackageExportTypeDataResolver } from '../../core/services/resolvers/data/sync-package-export-type.resolver';
import { CreateViewModifyV2Action } from '../../shared/components-v2/app-create-view-modify-v2/models/action.model';
import { UpstreamServersDataResolver } from '../../core/services/resolvers/data/upstream-servers.resolver';
import {
  SyncPackageStatusStepBackupRestoreResolver
} from '../../core/services/resolvers/data/sync-package-status-step-backup-restore.resolver';
import { DeletedUserDataResolver } from '../../core/services/resolvers/data/deleted-user.resolver';
import { CreatedOnResolver } from '../../core/services/resolvers/data/created-on.resolver';

// common base - create / view / modify
const deviceCreateViewModifyFoundation: Route = {
  component: fromPages.SystemDevicesCreateViewModifyComponent,
  canActivate: [AuthGuard],
  resolve: {
    user: UserDataResolver,
    deletedUser: DeletedUserDataResolver
  }
};

// common base - create / view / modify
const clientApplicationCreateViewModifyFoundation: Route = {
  component: fromPages.ClientApplicationsCreateViewModifyComponent,
  canActivate: [AuthGuard],
  resolve: {
    outbreak: OutbreakDataResolver,
    user: UserDataResolver,
    deletedUser: DeletedUserDataResolver
  }
};

// routes
const routes: Routes = [
  // Backups
  {
    path: 'backups',
    component: fromPages.BackupsComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.BACKUP_LIST
      ]
    },
    resolve: {
      yesNoAll: YesNoAllDataResolver,
      yesNo: YesNoDataResolver,
      backupModules: BackupModuleDataResolver,
      backupStatus: BackupStatusDataResolver,
      backupTypes: BackupTypesDataResolver,
      user: UserDataResolver
    }
  },
  {
    path: 'backups-restores',
    component: fromPages.BackupsRestoresComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.BACKUP_RESTORE
      ]
    },
    resolve: {
      yesNoAll: YesNoAllDataResolver,
      syncLogsStatus: SyncPackageStatusDataResolver,
      syncLogsStatusStep: SyncPackageStatusStepBackupRestoreResolver,
      user: UserDataResolver
    }
  },

  // Upstream Servers
  {
    path: 'upstream-servers',
    children: [
      {
        path: '',
        component: fromPages.UpstreamServersListComponent,
        canActivate: [AuthGuard],
        data: {
          permissions: [
            PERMISSION.UPSTREAM_SERVER_LIST
          ]
        },
        resolve: {
          yesNoAll: YesNoAllDataResolver
        }
      },
      {
        path: 'create',
        component: fromPages.UpstreamServersCreateViewModifyComponent,
        canActivate: [AuthGuard],
        data: {
          permissions: [
            PERMISSION.UPSTREAM_SERVER_CREATE
          ],
          action: CreateViewModifyV2Action.CREATE
        },
        resolve: {
          upstreamServers: UpstreamServersDataResolver
        }
      }
    ]
  },

  // Client Applications
  {
    path: 'client-applications',
    children: [
      {
        path: '',
        component: fromPages.ClientApplicationsListComponent,
        canActivate: [AuthGuard],
        data: {
          permissions: [
            PERMISSION.CLIENT_APPLICATION_LIST
          ]
        },
        resolve: {
          createdOn: CreatedOnResolver,
          yesNoAll: YesNoAllDataResolver,
          outbreak: OutbreakDataResolver,
          user: UserDataResolver
        }
      },
      {
        path: 'create',
        ...clientApplicationCreateViewModifyFoundation,
        data: {
          permissions: [
            PERMISSION.CLIENT_APPLICATION_CREATE
          ],
          action: CreateViewModifyV2Action.CREATE
        }
      },
      {
        path: ':clientApplicationId/view',
        ...clientApplicationCreateViewModifyFoundation,
        data: {
          permissions: [
            PERMISSION.CLIENT_APPLICATION_VIEW
          ],
          action: CreateViewModifyV2Action.VIEW
        }
      },
      {
        path: ':clientApplicationId/modify',
        ...clientApplicationCreateViewModifyFoundation,
        data: {
          permissions: [
            PERMISSION.CLIENT_APPLICATION_MODIFY
          ],
          action: CreateViewModifyV2Action.MODIFY
        },
        canDeactivate: [
          PageChangeConfirmationGuard
        ]
      }
    ]
  },

  // System Devices
  {
    path: 'devices',
    children: [
      {
        path: '',
        component: fromPages.SystemDevicesComponent,
        canActivate: [AuthGuard],
        data: {
          permissions: [
            PERMISSION.DEVICE_LIST
          ]
        },
        resolve: {
          createdOn: CreatedOnResolver,
          yesNoAll: YesNoAllDataResolver,
          user: UserDataResolver
        }
      },
      {
        path: ':deviceId/view',
        ...deviceCreateViewModifyFoundation,
        data: {
          permissions: [
            PERMISSION.DEVICE_VIEW
          ],
          action: CreateViewModifyV2Action.VIEW
        }
      },
      {
        path: ':deviceId/modify',
        ...deviceCreateViewModifyFoundation,
        data: {
          permissions: [
            PERMISSION.DEVICE_MODIFY
          ],
          action: CreateViewModifyV2Action.MODIFY
        },
        canDeactivate: [
          PageChangeConfirmationGuard
        ]
      },
      {
        path: ':deviceId/history',
        component: fromPages.ViewHistorySystemDeviceComponent,
        canActivate: [AuthGuard],
        data: {
          permissions: [
            PERMISSION.DEVICE_LIST_HISTORY
          ],
          action: CreateViewModifyV2Action.VIEW
        },
        canDeactivate: [
          PageChangeConfirmationGuard
        ]
      }
    ]
  },

  // Sync
  {
    path: 'sync-logs',
    component: fromPages.SystemSyncLogsComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: [
        PERMISSION.SYNC_LOG_LIST
      ]
    },
    resolve: {
      outbreak: OutbreakDataResolver,
      yesNoAll: YesNoAllDataResolver,
      yesNo: YesNoDataResolver,
      syncLogsStatus: SyncPackageStatusDataResolver,
      syncLogsModule: SyncPackageModuleDataResolver,
      syncLogsType: SyncPackageExportTypeDataResolver
    }
  }
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
