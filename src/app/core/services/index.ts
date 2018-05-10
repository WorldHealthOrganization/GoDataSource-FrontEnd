// import data services
import { AuthDataService } from './data/auth.data.service';
import { UserDataService } from './data/user.data.service';

// import helper services
import { StorageService } from './helper/storage.service';
import { LoggerService } from './helper/logger.service';

// export the list of services
export const services: any[] = [
    // data services
    AuthDataService,
    UserDataService,

    // helper services
    StorageService,
    LoggerService,
];
