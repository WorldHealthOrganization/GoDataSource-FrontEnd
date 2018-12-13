// import each page component
import { SystemConfigComponent } from './system-config/system-config.component';
import { SystemUpstreamSyncComponent } from './system-upstream-sync/system-upstream-sync.component';
import { CreateSystemUpstreamSyncComponent } from './create-system-upstream-sync/create-system-upstream-sync.component';
import { SystemClientApplicationsComponent } from './system-client-applications/system-client-applications.component';
import { CreateSystemClientApplicationComponent } from './create-system-client-application/create-system-client-application.component';
import { SystemSyncLogsComponent } from './system-sync-logs/system-sync-logs.component';
import { SystemDevicesComponent } from './system-devices/system-devices.component';
import { ModifySystemDeviceComponent } from './modify-system-device/modify-system-device.component';
import { ViewHistorySystemDeviceComponent } from './view-history-system-device/view-history-system-device.component';

// export each page component individually
export * from './system-config/system-config.component';
export * from './system-upstream-sync/system-upstream-sync.component';
export * from './create-system-upstream-sync/create-system-upstream-sync.component';
export * from './system-client-applications/system-client-applications.component';
export * from './create-system-client-application/create-system-client-application.component';
export * from './system-sync-logs/system-sync-logs.component';
export * from './system-devices/system-devices.component';
export * from './modify-system-device/modify-system-device.component';
export * from './view-history-system-device/view-history-system-device.component';

// export the list of all page components
export const pageComponents: any[] = [
    SystemConfigComponent,

    // Sync Upstream Servers
    SystemUpstreamSyncComponent,
    CreateSystemUpstreamSyncComponent,

    // System sync logs
    SystemSyncLogsComponent,

    // Sync Client Servers
    SystemClientApplicationsComponent,
    CreateSystemClientApplicationComponent,

    // Devices
    SystemDevicesComponent,
    ModifySystemDeviceComponent,
    ViewHistorySystemDeviceComponent
];
