// import each page component
import { ClustersListComponent } from './clusters-list/clusters-list.component';
import { CreateClusterComponent } from './create-cluster/create-cluster.component';
import { ModifyClusterComponent } from './modify-cluster/modify-cluster.component';

// export each page component individually
export * from './clusters-list/clusters-list.component';
export * from './create-cluster/create-cluster.component';
export * from './modify-cluster/modify-cluster.component';


// export the list of all page components
export const pageComponents: any[] = [
    ClustersListComponent,
    CreateClusterComponent,
    ModifyClusterComponent
];
