// import each page component
import { UserListComponent } from './user-list/user-list.component';
import { CreateUserComponent } from './create-user/create-user.component';
import { ModifyUserComponent } from './modify-user/modify-user.component';
import { ViewUserComponent } from './view-user/view-user.component';

// export each page component individually
export * from './user-list/user-list.component';
export * from './create-user/create-user.component';
export * from './modify-user/modify-user.component';
export * from './view-user/view-user.component';

// export the list of all page components
export const pageComponents: any[] = [
    UserListComponent,
    CreateUserComponent,
    ModifyUserComponent,
    ViewUserComponent
];
