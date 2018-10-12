// import each page component
import { SystemConfigComponent } from './system-config/system-config.component';
import { SystemUpstreamSyncComponent } from './system-upstream-sync/system-upstream-sync.component';
import { CreateSystemUpstreamSyncComponent } from './create-system-upstream-sync/create-system-upstream-sync.component';

// export each page component individually
export * from './system-config/system-config.component';
export * from './system-upstream-sync/system-upstream-sync.component';
export * from './create-system-upstream-sync/create-system-upstream-sync.component';

// export the list of all page components
export const pageComponents: any[] = [
    SystemConfigComponent,

    // Sync Upstream Servers
    SystemUpstreamSyncComponent,
    CreateSystemUpstreamSyncComponent

    // Sync Client Servers
    // #TODO
];
