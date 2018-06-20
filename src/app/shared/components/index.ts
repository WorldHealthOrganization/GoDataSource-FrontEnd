// import each component
import { SnackbarComponent } from './snackbar/snackbar.component';
import { TopnavComponent } from './topnav/topnav.component';
import { BreadcrumbsComponent} from './breadcrumbs/breadcrumbs.component';
import { FormAddressComponent } from './form-address/form-address.component';
import { FormAddressListComponent } from './form-address-list/form-address-list.component';
import { FormDocumentComponent } from './form-document/form-document.component';
import { FormDocumentListComponent } from './form-document-list/form-document-list.component';

// export necessary components individually
export * from './snackbar/snackbar.component';

// export the list of all components
export const components: any[] = [
    SnackbarComponent,
    TopnavComponent,
    BreadcrumbsComponent,
    FormAddressComponent,
    FormAddressListComponent,
    FormDocumentComponent,
    FormDocumentListComponent
];
