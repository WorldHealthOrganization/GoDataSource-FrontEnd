// import each page component
import { RolesListComponent } from './roles-list/roles-list.component';
import { RolesCreateViewModifyComponent } from './roles-create-view-modify/roles-create-view-modify.component';

// export each page component individually
export * from './roles-create-view-modify/roles-create-view-modify.component';
export * from './roles-list/roles-list.component';

// export the list of all page components
export const pageComponents: any[] = [
  RolesCreateViewModifyComponent,
  RolesListComponent
];
