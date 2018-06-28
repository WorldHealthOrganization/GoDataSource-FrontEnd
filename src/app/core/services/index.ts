// import data services
import { AuthDataService } from './data/auth.data.service';
import { UserDataService } from './data/user.data.service';
import { OutbreakDataService } from './data/outbreak.data.service';
import { ContactDataService } from './data/contact.data.service';
import { CaseDataService } from './data/case.data.service';
import { EventDataService } from './data/event.data.service';
import { GenericDataService } from './data/generic.data.service';
import { LocationDataService } from './data/location.data.service';
import { UserRoleDataService } from './data/user-role.data.service';
import { LanguageDataService } from './data/language.data.service';

// import helper services
import { StorageService } from './helper/storage.service';
import { LoggerService } from './helper/logger.service';
import { AuthGuard } from './helper/auth-guard.service';
import { SnackbarService } from './helper/snackbar.service';
import { ModelHelperService } from './helper/model-helper.service';
import { RouterHelperService } from './helper/router-helper.service';
import { FormHelperService } from './helper/form-helper.service';
import { I18nService } from './helper/i18n.service';
import { CacheService } from './helper/cache.service';
import { DialogService } from './helper/dialog.service';

// export the list of services
export const services: any[] = [
    // data services
    AuthDataService,
    UserDataService,
    UserRoleDataService,
    OutbreakDataService,
    ContactDataService,
    CaseDataService,
    EventDataService,
    GenericDataService,
    LocationDataService,
    LanguageDataService,

    // helper services
    StorageService,
    LoggerService,
    AuthGuard,
    SnackbarService,
    ModelHelperService,
    RouterHelperService,
    FormHelperService,
    I18nService,
    CacheService,
    DialogService
];
