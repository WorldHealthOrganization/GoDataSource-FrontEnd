// import each page component
import { ClustersListComponent } from './clusters-list/clusters-list.component';
import { ClustersPeopleListComponent } from './clusters-people-list/clusters-people-list.component';
import { ClusterCreateViewModifyComponent } from './cluster-create-view-modify/cluster-create-view-modify.component';

// export each page component individually
export * from './clusters-list/clusters-list.component';
export * from './clusters-people-list/clusters-people-list.component';
export * from './cluster-create-view-modify/cluster-create-view-modify.component';


// export the list of all page components
export const pageComponents: any[] = [
  ClustersListComponent,
  ClustersPeopleListComponent,
  ClusterCreateViewModifyComponent
];
