// import each page component
import { UserListComponent } from './user-list/user-list.component';
import { UserWorkloadComponent } from './user-workload/user-workload.component';
import { UserCreateViewModifyComponent } from './user-create-view-modify/user-create-view-modify.component';

// export each page component individually
export * from './user-create-view-modify/user-create-view-modify.component';
export * from './user-list/user-list.component';
export * from './user-workload/user-workload.component';

// export the list of all page components
export const pageComponents: any[] = [
  UserCreateViewModifyComponent,
  UserListComponent,
  UserWorkloadComponent
];
