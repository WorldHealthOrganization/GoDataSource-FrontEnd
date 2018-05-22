// import each component
import { SnackbarComponent } from './snackbar/snackbar.component';
import { TopnavComponent } from './topnav/topnav.component';

// export each component individually
export * from './snackbar/snackbar.component';

// export the list of all components
export const components: any[] = [
    SnackbarComponent,
    TopnavComponent,
];
