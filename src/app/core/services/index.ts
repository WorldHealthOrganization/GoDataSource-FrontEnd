// import data services
import { AuthDataService } from './data/auth.data.service';
import { UserDataService } from './data/user.data.service';
import { OutbreakDataService } from './data/outbreak.data.service';


// import helper services
import { StorageService } from './helper/storage.service';
import { LoggerService } from './helper/logger.service';
import { AuthGuard } from './helper/auth-guard.service';
import { SnackbarService } from './helper/snackbar.service';

// export the list of services
export const services: any[] = [
    // data services
    AuthDataService,
    UserDataService,
    OutbreakDataService,

    // helper services
    StorageService,
    LoggerService,
    AuthGuard,
    SnackbarService,
];
