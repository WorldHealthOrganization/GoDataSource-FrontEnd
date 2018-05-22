// import data services
import { AuthDataService } from './data/auth.data.service';
import { UserDataService } from './data/user.data.service';
import { UserRoleDataService } from './data/user-role.data.service';

// import helper services
import { StorageService } from './helper/storage.service';
import { LoggerService } from './helper/logger.service';
import { AuthGuard } from './helper/auth-guard.service';
import { SnackbarService } from './helper/snackbar.service';
import { ObservableHelperService } from './helper/observable-helper.service';

// export the list of services
export const services: any[] = [
    // data services
    AuthDataService,
    UserDataService,
    UserRoleDataService,

    // helper services
    StorageService,
    LoggerService,
    AuthGuard,
    SnackbarService,
    ObservableHelperService,
];
