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
import { ImportExportDataService } from './data/import-export.data.service';
import { IconDataService } from './data/icon.data.service';
import { SystemSettingsDataService } from './data/system-settings.data.service';
import { SystemBackupDataService } from './data/system-backup.data.service';
import { OutbreakTemplateDataService } from './data/outbreak-template.data.service';
import { SystemSyncDataService } from './data/system-sync.data.service';
import { SystemSyncLogDataService } from './data/system-sync-log.data.service';
import { TeamDataService } from './data/team.data.service';
import { AttachmentDataService } from './data/attachment.data.service';
import { StorageService } from './helper/storage.service';
import { LoggerService } from './helper/logger.service';
import { ModelHelperService } from './helper/model-helper.service';
import { FormHelperService } from './helper/form-helper.service';
import { I18nService } from './helper/i18n.service';
import { CacheService } from './helper/cache.service';
import { DialogService } from './helper/dialog.service';
import { DomService } from './helper/dom.service';
import { AuthGuard } from './guards/auth-guard.service';
import { PasswordChangeGuard } from './guards/password-change-guard.service';
import { PageChangeConfirmationGuard } from './guards/page-change-confirmation-guard.service';
import { LanguageResolver } from './resolvers/language.resolver';
import { AuditLogDataService } from './data/audit-log.data.service';
import { HelpDataService } from './data/help.data.service';
import { GlobalEntitySearchDataService } from './data/global-entity-search.data.service';
import { DeviceDataService } from './data/device.data.service';
import { SavedFiltersService } from './data/saved-filters.data.service';
import { SavedImportMappingService } from './data/saved-import-mapping.data.service';
import { RedirectService } from './helper/redirect.service';
import { EntityHelperService } from './helper/entity-helper.service';
import { ContactsOfContactsDataService } from './data/contacts-of-contacts.data.service';
import { CaptchaDataService } from './data/captcha.data.service';
import { ListHelperService } from './helper/list-helper.service';
import { ImportLogDataService } from './data/import-log.data.service';
import { ImportResultDataService } from './data/import-result.data.service';
import { ExportLogDataService } from './data/export-log.data.service';
import { DialogV2Service } from './helper/dialog-v2.service';
import { ToastV2Service } from './helper/toast-v2.service';
import { ClassificationDataResolver } from './resolvers/data/classification.resolver';
import { RiskDataResolver } from './resolvers/data/risk.resolver';
import { OutcomeDataResolver } from './resolvers/data/outcome.resolver';
import { GenderDataResolver } from './resolvers/data/gender.resolver';
import { YesNoAllDataResolver } from './resolvers/data/yes-no-all.resolver';
import { UserDataResolver } from './resolvers/data/user.resolver';
import { OccupationDataResolver } from './resolvers/data/occupation.resolver';
import { YesNoDataResolver } from './resolvers/data/yes-no.resolver';
import { PregnancyStatusDataResolver } from './resolvers/data/pregnancy-status.resolver';
import { VaccineDataResolver } from './resolvers/data/vaccine.resolver';
import { VaccineStatusDataResolver } from './resolvers/data/vaccine-status.resolver';
import { FinalFollowUpStatusDataResolver } from './resolvers/data/final-follow-up-status.resolver';
import { DailyFollowUpStatusDataResolver } from './resolvers/data/daily-follow-up-status.resolver';
import { DiseaseDataResolver } from './resolvers/data/disease.resolver';
import { FollowUpGenerationTeamAssignmentAlgorithmDataResolver } from './resolvers/data/follow-up-generation-team-assignment-algorithm.resolver';
import { LocationGeographicalLevelDataResolver } from './resolvers/data/location-geographical-level.resolver';
import { CountryDataResolver } from './resolvers/data/country.resolver';

// export the list of services
export const services: any[] = [
  // resolver services
  ClassificationDataResolver,
  CountryDataResolver,
  DailyFollowUpStatusDataResolver,
  DiseaseDataResolver,
  FinalFollowUpStatusDataResolver,
  FollowUpGenerationTeamAssignmentAlgorithmDataResolver,
  GenderDataResolver,
  LanguageResolver,
  LocationGeographicalLevelDataResolver,
  OccupationDataResolver,
  OutcomeDataResolver,
  PregnancyStatusDataResolver,
  RiskDataResolver,
  UserDataResolver,
  YesNoAllDataResolver,
  YesNoDataResolver,
  VaccineDataResolver,
  VaccineStatusDataResolver,

  // data services
  AuthDataService,
  UserDataService,
  UserRoleDataService,
  OutbreakDataService,
  OutbreakTemplateDataService,
  ContactDataService,
  ContactsOfContactsDataService,
  CaseDataService,
  EventDataService,
  GenericDataService,
  LocationDataService,
  LanguageDataService,
  LoggingDataService,
  ClusterDataService,
  SavedFiltersService,
  RelationshipDataService,
  FollowUpsDataService,
  ReferenceDataDataService,
  LabResultDataService,
  ListFilterDataService,
  EntityDataService,
  TransmissionChainDataService,
  ImportExportDataService,
  IconDataService,
  SavedImportMappingService,
  SystemSettingsDataService,
  SystemBackupDataService,
  SystemSyncDataService,
  SystemSyncLogDataService,
  AttachmentDataService,
  TeamDataService,
  AuditLogDataService,
  HelpDataService,
  GlobalEntitySearchDataService,
  DeviceDataService,
  CaptchaDataService,
  ImportLogDataService,
  ImportResultDataService,
  ExportLogDataService,

  // guard services
  AuthGuard,
  PasswordChangeGuard,
  PageChangeConfirmationGuard,

  // helper services
  StorageService,
  LoggerService,
  ModelHelperService,
  FormHelperService,
  I18nService,
  CacheService,
  DialogService,
  DialogV2Service,
  DomService,
  RedirectService,
  EntityHelperService,
  ListHelperService,
  ToastV2Service
];
