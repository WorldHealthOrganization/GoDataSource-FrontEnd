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
import { LoggingDataService } from './data/logging.data.service';
import { ReferenceDataDataService } from './data/reference-data.data.service';
import { ClusterDataService } from './data/cluster.data.service';
import { RelationshipDataService } from './data/relationship.data.service';
import { FollowUpsDataService } from './data/follow-ups.data.service';
import { LabResultDataService } from './data/lab-result.data.service';
import { ListFilterDataService } from './data/list-filter.data.service';
import { EntityDataService } from './data/entity.data.service';
import { TransmissionChainDataService } from './data/transmission-chain.data.service';

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
import { DomService } from './helper/dom.service';
import { LanguageResolver } from './resolvers/language.resolver';
import { PasswordChangeGuard } from './helper/password-change-guard.service';

// export the list of services
export const services: any[] = [
    // resolvers services
    LanguageResolver,

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
    LoggingDataService,
    ClusterDataService,
    RelationshipDataService,
    FollowUpsDataService,
    ReferenceDataDataService,
    LabResultDataService,
    ListFilterDataService,
    EntityDataService,
    TransmissionChainDataService,

    // helper services
    StorageService,
    LoggerService,
    AuthGuard,
    PasswordChangeGuard,
    SnackbarService,
    ModelHelperService,
    RouterHelperService,
    FormHelperService,
    I18nService,
    CacheService,
    DialogService,
    DomService
];
