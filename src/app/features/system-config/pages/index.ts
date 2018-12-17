// import each page component
import { UpstreamServersListComponent } from './upstream-servers-list/upstream-servers-list.component';
import { CreateUpstreamServerComponent } from './create-upstream-server/create-upstream-server.component';
import { ClientApplicationsListComponent } from './client-applications-list/client-applications-list.component';
import { CreateClientApplicationComponent } from './create-client-application/create-client-application.component';
import { BackupsComponent } from './backups/backups.component';
import { SystemDevicesComponent } from './system-devices/system-devices.component';
import { ModifySystemDeviceComponent } from './modify-system-device/modify-system-device.component';
import { ViewHistorySystemDeviceComponent } from './view-history-system-device/view-history-system-device.component';
import { SystemSyncLogsComponent } from './system-sync-logs/system-sync-logs.component';

// export each page component individually
export * from './upstream-servers-list/upstream-servers-list.component';
export * from './create-upstream-server/create-upstream-server.component';
export * from './client-applications-list/client-applications-list.component';
export * from './create-client-application/create-client-application.component';
export * from './backups/backups.component';
export * from './system-devices/system-devices.component';
export * from './modify-system-device/modify-system-device.component';
export * from './view-history-system-device/view-history-system-device.component';
export * from './system-sync-logs/system-sync-logs.component';

// export the list of all page components
export const pageComponents: any[] = [
    UpstreamServersListComponent,
    CreateUpstreamServerComponent,
    ClientApplicationsListComponent,
    CreateClientApplicationComponent,
    BackupsComponent,
    SystemDevicesComponent,
    ModifySystemDeviceComponent,
    ViewHistorySystemDeviceComponent,
    SystemSyncLogsComponent,
];
