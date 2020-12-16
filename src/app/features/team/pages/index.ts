// import each page component
import { TeamListComponent } from './team-list/team-list.component';
import { CreateTeamComponent } from './create-team/create-team.component';
import { ModifyTeamComponent } from './modify-team/modify-team.component';
import { TeamWorkloadComponent } from './team-workload/team-workload.component';

// export each page component individually
export * from './team-list/team-list.component';
export * from './create-team/create-team.component';
export * from './modify-team/modify-team.component';
export * from './team-workload/team-workload.component';

// export the list of all page components
export const pageComponents: any[] = [
    TeamListComponent,
    CreateTeamComponent,
    ModifyTeamComponent,
    TeamWorkloadComponent
];
