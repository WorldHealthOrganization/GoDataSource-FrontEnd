// import each page component
import { AuthenticatedComponent } from './authenticated/authenticated.component';
import { SidenavComponent } from './sidenav/sidenav.component';
import { RedirectComponent } from './redirect/redirect.component';
import { TopnavComponent } from './topnav/topnav.component';
import { TopnavUnauthenticatedComponent } from './topnav-unauthenticated/topnav-unauthenticated.component';

// export the list of all components
export const components: any[] = [
  AuthenticatedComponent,
  SidenavComponent,
  RedirectComponent,
  TopnavComponent,
  TopnavUnauthenticatedComponent
];
