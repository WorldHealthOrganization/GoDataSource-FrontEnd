// import each page component
import { TeamListComponent } from './team-list/team-list.component';
import { TeamWorkloadComponent } from './team-workload/team-workload.component';
import { TeamCreateViewModifyComponent } from './team-create-view-modify/team-create-view-modify.component';

// export each page component individually
export * from './team-list/team-list.component';
export * from './team-workload/team-workload.component';

// export the list of all page components
export const pageComponents: any[] = [
  TeamCreateViewModifyComponent,
  TeamListComponent,
  TeamWorkloadComponent
];
