// import data services
import { AuthDataService } from './data/auth.data.service';
import { UserDataService } from './data/user.data.service';
import { OutbreakDataService } from './data/outbreak.data.service';
import { CaseDataService } from './data/case.data.service';
import { GenericDataService } from './data/generic.data.service';
import { LocationDataService } from './data/location.data.service';
import { UserRoleDataService } from './data/user-role.data.service';
import { LanguageDataService } from './data/language.data.service';

// import helper services
import { StorageService } from './helper/storage.service';
import { LoggerService } from './helper/logger.service';
import { AuthGuard } from './helper/auth-guard.service';
import { SnackbarService } from './helper/snackbar.service';
import { ObservableHelperService } from './helper/observable-helper.service';
import { RouterHelperService } from './helper/router-helper.service';
import { FormHelperService } from './helper/form-helper.service';
import { I18nService } from './helper/i18n.service';

// export the list of services
export const services: any[] = [
    // data services
    AuthDataService,
    UserDataService,
    UserRoleDataService,
    OutbreakDataService,
    CaseDataService,
    GenericDataService,
    LocationDataService,
    LanguageDataService,

    // helper services
    StorageService,
    LoggerService,
    AuthGuard,
    SnackbarService,
    ObservableHelperService,
    RouterHelperService,
    FormHelperService,
    I18nService,
];
