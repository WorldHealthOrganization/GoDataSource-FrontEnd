// import each page component
import { RolesListComponent } from './roles-list/roles-list.component';
import { CreateRoleComponent } from './create-role/create-role.component';

// export each page component individually
export * from './roles-list/roles-list.component';
export * from './create-role/create-role.component';

// export the list of all page components
export const pageComponents: any[] = [
    RolesListComponent,
    CreateRoleComponent,
];
