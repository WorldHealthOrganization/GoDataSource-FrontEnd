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
import { DomService } from './helper/dom.service';
import { AuthGuard } from './guards/auth-guard.service';
import { PasswordChangeGuard } from './guards/password-change-guard.service';
import { PageChangeConfirmationGuard } from './guards/page-change-confirmation-guard.service';
import { AuditLogDataService } from './data/audit-log.data.service';
import { HelpDataService } from './data/help.data.service';
import { GlobalEntitySearchDataService } from './data/global-entity-search.data.service';
import { DeviceDataService } from './data/device.data.service';
import { SavedFiltersService } from './data/saved-filters.data.service';
import { SavedImportMappingService } from './data/saved-import-mapping.data.service';
import { RedirectService } from './helper/redirect.service';
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
import { TeamDataResolver } from './resolvers/data/team.resolver';
import { SelectedOutbreakDataResolver } from './resolvers/data/selected-outbreak.resolver';
import { DocumentTypeDataResolver } from './resolvers/data/document-type.resolver';
import { AddressTypeDataResolver } from './resolvers/data/address-type.resolver';
import { PersonDateTypeDataResolver } from './resolvers/data/person-date-type.resolver';
import { DateRangeCenterDataResolver } from './resolvers/data/date-range-center.resolver';
import { OutbreakDataResolver } from './resolvers/data/outbreak.resolver';
import { UserRoleDataResolver } from './resolvers/data/user-role.resolver';
import { InstitutionDataResolver } from './resolvers/data/institution.resolver';
import { PermissionDataResolver } from './resolvers/data/permission.resolver';
import { CertaintyLevelDataResolver } from './resolvers/data/certainty-level.resolver';
import { ExposureTypeDataResolver } from './resolvers/data/exposure-type.resolver';
import { ExposureFrequencyDataResolver } from './resolvers/data/exposure-frequency.resolver';
import { ExposureDurationDataResolver } from './resolvers/data/exposure-duration.resolver';
import { ContextOfTransmissionDataResolver } from './resolvers/data/context-of-transmission.resolver';
import { ClusterDataResolver } from './resolvers/data/cluster.resolver';
import { PersonTypeDataResolver } from './resolvers/data/person-type.resolver';
import { RelationshipPersonDataResolver } from './resolvers/data/relationship-person.resolver';
import { LabNameDataResolver } from './resolvers/data/lab-name.resolver';
import { LabSampleTypeDataResolver } from './resolvers/data/lab-sample-type.resolver';
import { LabTestTypeDataResolver } from './resolvers/data/lab-test-type.resolver';
import { LabTestResultDataResolver } from './resolvers/data/lab-test-result.resolver';
import { LabProgressDataResolver } from './resolvers/data/lab-progress.resolver';
import { LabSequenceLaboratoryDataResolver } from './resolvers/data/lab-sequence-laboratory.resolver';
import { LabSequenceResultDataResolver } from './resolvers/data/lab-sequence-result.resolver';
import { VersionDataResolver } from './resolvers/data/version.resolver';
import { LanguageUserResolver } from './resolvers/language-user.resolver';
import { LanguageDataResolver } from './resolvers/data/language.resolver';
import { PersonDataResolver } from './resolvers/data/person.resolver';
import { NotAuthRedirectGuard } from './guards/not-auth-redirect-guard.service';
import { SecurityQuestionDataResolver } from './resolvers/data/security-question.resolver';
import { MapVectorTypeDataResolver } from './resolvers/data/map-vector-type.resolver';
import { OutbreakTemplateDataResolver } from './resolvers/data/outbreak-template.resolver';
import { QuestionnaireAnswerTypeDataResolver } from './resolvers/data/questionnaire-answer-type.resolver';
import { QuestionnaireQuestionCategoryDataResolver } from './resolvers/data/questionnaire-question-category.resolver';
import { QuestionnaireAnswerDisplayDataResolver } from './resolvers/data/questionnaire-answer-display.resolver';
import { BackupModuleDataResolver } from './resolvers/data/backup-module.resolver';
import { BackupStatusDataResolver } from './resolvers/data/backup-status.resolver';
import { BackupTypesDataResolver } from './resolvers/data/backup-types.resolver';
import { LabPersonTypeDataResolver } from './resolvers/data/lab-person-type.resolver';
import { SyncPackageModuleDataResolver } from './resolvers/data/sync-package-module.resolver';
import { SyncPackageExportTypeDataResolver } from './resolvers/data/sync-package-export-type.resolver';
import { SyncPackageStatusDataResolver } from './resolvers/data/sync-package-status.resolver';
import { SavedImportMappingDataResolver } from './resolvers/data/saved-import-mapping.resolver';
import { GanttChartTypeDataResolver } from './resolvers/data/gantt-chart-type.resolver';
import { ReferenceDataCategoryDataResolver } from './resolvers/data/reference-data-category.resolver';
import { EpiCurveWeekTypesDataResolver } from './resolvers/data/epi-curve-week-types.resolver';
import { CotNodeLabelDataResolver } from './resolvers/data/cot-node-label.resolver';
import { CotNodeColorDataResolver } from './resolvers/data/cot-node-color.resolver';
import { CotNodeIconDataResolver } from './resolvers/data/cot-node-icon.resolver';
import { CotNodeShapeDataResolver } from './resolvers/data/cot-node-shape.resolver';
import { CotEdgeLabelDataResolver } from './resolvers/data/cot-edge-label.resolver';
import { CotEdgeIconDataResolver } from './resolvers/data/cot-edge-icon.resolver';
import { CotEdgeColorDataResolver } from './resolvers/data/cot-edge-color.resolver';
import { UpstreamServersDataResolver } from './resolvers/data/upstream-servers.resolver';
import { IconDataResolver } from './resolvers/data/icon.resolver';
import { SelectedClusterDataResolver } from './resolvers/data/selected-cluster.resolver';
import { CotSnapshotStatusDataResolver } from './resolvers/data/cot-snapshot-status.resolver';
import { SelectedHelpCategoryDataResolver } from './resolvers/data/selected-help-category.resolver';
import { InvestigationStatusDataResolver } from './resolvers/data/investigation-status.resolver';
import { SelectedLanguageDataResolver } from './resolvers/data/selected-language.resolver';
import { LocationTreeDataResolver } from './resolvers/data/location-tree.resolver';
import { SelectedUserRoleDataResolver } from './resolvers/data/selected-user-role.resolver';
import { SelectedEntitiesDataResolver } from './resolvers/data/selected-entities.resolver';
import { HelpCategoryDataResolver } from './resolvers/data/help-category.resolver';
import { AuditLogActionDataResolver } from './resolvers/data/audit-log-action.resolver';
import { AuditLogModuleDataResolver } from './resolvers/data/audit-log-module.resolver';
import { EventCategoryDataResolver } from './resolvers/data/event-category.resolver';
import { FollowUpGroupByDataResolver } from './resolvers/data/follow-up-group-by.resolver';
import { FontResolver } from './resolvers/font-resolver';
import { ImageResolver } from './resolvers/image-resolver';
import { ReferenceDataDiseaseSpecificCategoriesResolver } from './resolvers/data/reference-data-disease-specific-categories.resolver';
import { ReferenceDataHelperService } from './helper/reference-data-helper.service';
import { BulkCacheHelperService } from './helper/bulk-cache-helper.service';
import { RestoreLogDataService } from './data/restore-log.data.service';
import {
  SyncPackageStatusStepBackupRestoreResolver
} from './resolvers/data/sync-package-status-step-backup-restore.resolver';
import { OutbreakAndOutbreakTemplateHelperService } from './helper/outbreak-and-outbreak-template-helper.service';
import { PersonAndRelatedHelperService } from './helper/person-and-related-helper.service';
import { CreatedOnResolver } from './resolvers/data/created-on.resolver';
import { DeletedUserDataResolver } from './resolvers/data/deleted-user.resolver';
import { ClientApplicationDataService } from './data/client-application.data.service';
import { ClientApplicationHelperService } from './helper/client-application-helper.service';
import { FollowUpCreatedAsDataResolver } from './resolvers/data/follow-up-created-as.resolver';

// export the list of services
export const services: any[] = [
  // resolver services
  AddressTypeDataResolver,
  AuditLogActionDataResolver,
  AuditLogModuleDataResolver,
  BackupModuleDataResolver,
  BackupStatusDataResolver,
  BackupTypesDataResolver,
  BulkCacheHelperService,
  CertaintyLevelDataResolver,
  ClassificationDataResolver,
  ClusterDataResolver,
  ContextOfTransmissionDataResolver,
  CotEdgeColorDataResolver,
  CotEdgeIconDataResolver,
  CotEdgeLabelDataResolver,
  CotNodeColorDataResolver,
  CotNodeIconDataResolver,
  CotNodeLabelDataResolver,
  CotNodeShapeDataResolver,
  CotSnapshotStatusDataResolver,
  CountryDataResolver,
  CreatedOnResolver,
  DailyFollowUpStatusDataResolver,
  DateRangeCenterDataResolver,
  DeletedUserDataResolver,
  DiseaseDataResolver,
  DocumentTypeDataResolver,
  EpiCurveWeekTypesDataResolver,
  ExposureDurationDataResolver,
  ExposureFrequencyDataResolver,
  ExposureTypeDataResolver,
  EventCategoryDataResolver,
  FinalFollowUpStatusDataResolver,
  FollowUpGenerationTeamAssignmentAlgorithmDataResolver,
  FollowUpGroupByDataResolver,
  FontResolver,
  GanttChartTypeDataResolver,
  GenderDataResolver,
  HelpCategoryDataResolver,
  IconDataResolver,
  ImageResolver,
  InstitutionDataResolver,
  InvestigationStatusDataResolver,
  LabNameDataResolver,
  LabPersonTypeDataResolver,
  LabProgressDataResolver,
  LabSampleTypeDataResolver,
  LabSequenceLaboratoryDataResolver,
  LabSequenceResultDataResolver,
  LabTestResultDataResolver,
  LabTestTypeDataResolver,
  LanguageDataResolver,
  LanguageUserResolver,
  LocationGeographicalLevelDataResolver,
  LocationTreeDataResolver,
  MapVectorTypeDataResolver,
  OccupationDataResolver,
  OutbreakDataResolver,
  OutbreakTemplateDataResolver,
  OutcomeDataResolver,
  PermissionDataResolver,
  PersonDataResolver,
  PersonDateTypeDataResolver,
  PersonTypeDataResolver,
  PregnancyStatusDataResolver,
  QuestionnaireAnswerDisplayDataResolver,
  QuestionnaireAnswerTypeDataResolver,
  QuestionnaireQuestionCategoryDataResolver,
  ReferenceDataCategoryDataResolver,
  ReferenceDataDiseaseSpecificCategoriesResolver,
  RelationshipPersonDataResolver,
  RiskDataResolver,
  SavedImportMappingDataResolver,
  SecurityQuestionDataResolver,
  SelectedClusterDataResolver,
  SelectedEntitiesDataResolver,
  SelectedHelpCategoryDataResolver,
  SelectedLanguageDataResolver,
  SelectedOutbreakDataResolver,
  SelectedUserRoleDataResolver,
  SyncPackageExportTypeDataResolver,
  SyncPackageModuleDataResolver,
  SyncPackageStatusDataResolver,
  SyncPackageStatusStepBackupRestoreResolver,
  TeamDataResolver,
  UpstreamServersDataResolver,
  UserDataResolver,
  UserRoleDataResolver,
  YesNoAllDataResolver,
  YesNoDataResolver,
  VaccineDataResolver,
  VaccineStatusDataResolver,
  VersionDataResolver,
  FollowUpCreatedAsDataResolver,

  // data services
  AuthDataService,
  ClientApplicationDataService,
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
  RestoreLogDataService,

  // guard services
  AuthGuard,
  NotAuthRedirectGuard,
  PasswordChangeGuard,
  PageChangeConfirmationGuard,

  // helper services
  CacheService,
  ClientApplicationHelperService,
  DialogV2Service,
  DomService,
  FormHelperService,
  I18nService,
  ListHelperService,
  LoggerService,
  ModelHelperService,
  OutbreakAndOutbreakTemplateHelperService,
  PersonAndRelatedHelperService,
  RedirectService,
  ReferenceDataHelperService,
  StorageService,
  ToastV2Service
];
