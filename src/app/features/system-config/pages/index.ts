// import each page component
import { UpstreamServersListComponent } from './upstream-servers-list/upstream-servers-list.component';
import { ClientApplicationsListComponent } from './client-applications-list/client-applications-list.component';
import { BackupsComponent } from './backups/backups.component';
import { SystemDevicesComponent } from './system-devices/system-devices.component';
import { ModifySystemDeviceComponent } from './modify-system-device/modify-system-device.component';
import { ViewHistorySystemDeviceComponent } from './view-history-system-device/view-history-system-device.component';
import { SystemSyncLogsComponent } from './system-sync-logs/system-sync-logs.component';
import { UpstreamServersCreateViewModifyComponent } from './upstream-servers-create-view-modify/upstream-servers-create-view-modify.component';
import { ClientApplicationsCreateViewModifyComponent } from './client-applications-create-view-modify/client-applications-create-view-modify.component';

// export each page component individually
export * from './upstream-servers-create-view-modify/upstream-servers-create-view-modify.component';
export * from './upstream-servers-list/upstream-servers-list.component';
export * from './client-applications-create-view-modify/client-applications-create-view-modify.component';
export * from './client-applications-list/client-applications-list.component';
export * from './backups/backups.component';
export * from './system-devices/system-devices.component';
export * from './modify-system-device/modify-system-device.component';
export * from './view-history-system-device/view-history-system-device.component';
export * from './system-sync-logs/system-sync-logs.component';

// export the list of all page components
export const pageComponents: any[] = [
  UpstreamServersCreateViewModifyComponent,
  UpstreamServersListComponent,
  ClientApplicationsCreateViewModifyComponent,
  ClientApplicationsListComponent,

  BackupsComponent,
  SystemDevicesComponent,
  ModifySystemDeviceComponent,
  ViewHistorySystemDeviceComponent,
  SystemSyncLogsComponent
];
