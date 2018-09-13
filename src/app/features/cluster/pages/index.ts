// import each page component
import { ClustersListComponent } from './clusters-list/clusters-list.component';
import { CreateClusterComponent } from './create-cluster/create-cluster.component';
import { ModifyClusterComponent } from './modify-cluster/modify-cluster.component';
import { ClustersPeopleListComponent } from './clusters-people-list/clusters-people-list.component';

// export each page component individually
export * from './clusters-list/clusters-list.component';
export * from './create-cluster/create-cluster.component';
export * from './modify-cluster/modify-cluster.component';
export * from './clusters-people-list/clusters-people-list.component';


// export the list of all page components
export const pageComponents: any[] = [
    ClustersListComponent,
    CreateClusterComponent,
    ModifyClusterComponent,
    ClustersPeopleListComponent
];
