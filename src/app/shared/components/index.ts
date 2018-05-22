// import each component
import { SnackbarComponent } from './snackbar/snackbar.component';
import { TopnavComponent } from './topnav/topnav.component';
import { BreadcrumbsComponent} from './breadcrumbs/breadcrumbs.component';

// export necessary components individually
export * from './snackbar/snackbar.component';

// export the list of all components
export const components: any[] = [
    SnackbarComponent,
    TopnavComponent,
    BreadcrumbsComponent
];
