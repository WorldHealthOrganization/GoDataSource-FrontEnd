import { UserModel } from './user.model';

/**
 * Basic
 */
export interface IPermissionBasic {
    /**
     * Has view permission ?
     */
    canView(user: UserModel): boolean;

    /**
     * Has list permission ?
     */
    canList(user: UserModel): boolean;

    /**
     * Has create permission ?
     */
    canCreate(user: UserModel): boolean;

    /**
     * Has modify permission ?
     */
    canModify(user: UserModel): boolean;

    /**
     * Has delete permission ?
     */
    canDelete(user: UserModel): boolean;
}

/**
 * Basic Bulk
 */
export interface IPermissionBasicBulk {
    /**
     * Has bulk create permission ?
     */
    canBulkCreate(user: UserModel): boolean;

    /**
     * Has bulk modify permission ?
     */
    canBulkModify(user: UserModel): boolean;

    /**
     * Has bulk delete permission ?
     */
    canBulkDelete(user: UserModel): boolean;

    /**
     * Has bulk restore permission ?
     */
    canBulkRestore(user: UserModel): boolean;
}

/**
 * Restore
 */
export interface IPermissionRestorable {
    /**
     * Has restore permission ?
     */
    canRestore(user: UserModel): boolean;
}

/**
 * Export
 */
export interface IPermissionExportable {
    /**
     * Has export permission ?
     */
    canExport(user: UserModel): boolean;
}

/**
 * Import
 */
export interface IPermissionImportable {
    /**
     * Has import permission ?
     */
    canImport(user: UserModel): boolean;
}

/**
 * Clone
 */
export interface IPermissionCloneable {
    /**
     * Has permission to create a clone
     */
    canClone(user: UserModel): boolean;
}

/**
 * Language
 */
export interface IPermissionLanguage {
    /**
     * Has permission to export language tokens
     */
    canExportTokens(user: UserModel): boolean;

    /**
     * Has permission to import language tokens
     */
    canImportTokens(user: UserModel): boolean;
}

/**
 * Help
 */
export interface IPermissionHelp {
    /**
     * Has permission to approve category items
     */
    canApproveCategoryItems(user: UserModel): boolean;
}

/**
 * Location
 */
export interface IPermissionLocation {
    /**
     * Has permission to see location usage
     */
    canListUsage(user: UserModel): boolean;

    /**
     * Has permission to propagate latitude and longitude to persons that use this location and have the same previous lat and lng as the location
     */
    canPropagateGeoToPersons(user: UserModel): boolean;
}

/**
 * User
 */
export interface IPermissionUser {
    /**
     * Has permission to modify his account
     */
    canModifyOwnAccount(user: UserModel): boolean;

    /**
     * Has permission to list users in dropdowns used to filter other list pages
     */
    canListForFilters(user: UserModel): boolean;
}

/**
 * Backup
 */
export interface IPermissionBackup {
    /**
     * Has permission to set automatic backup settings
     */
    canSetAutomaticBackupSettings(user: UserModel): boolean;

    /**
     * Has permission to view cloud backup locations
     */
    canViewCloudBackupLocations(user: UserModel): boolean;
}

/**
 * Sync log
 */
export interface IPermissionSyncLog {
    /**
     * Has permission to set sync settings
     */
    canSetSettings(user: UserModel): boolean;

    /**
     * Has permission to sync two GoData instances
     */
    canSynchronize(user: UserModel): boolean;

    /**
     * Has permission to export sync package
     */
    canExportPackage(user: UserModel): boolean;

    /**
     * Has permission to import sync package
     */
    canImportPackage(user: UserModel): boolean;
}

/**
 * Upstream Server
 */
export interface IPermissionUpstreamServer {
    /**
     * Has permission to sync two GoData instances
     */
    canSync(user: UserModel): boolean;

    /**
     * Has permission to enable sync
     */
    canEnableSync(user: UserModel): boolean;

    /**
     * Has permission to disable sync
     */
    canDisableSync(user: UserModel): boolean;
}

/**
 * Client Application
 */
export interface IPermissionClientApplication {
    /**
     * Has permission to download config file
     */
    canDownloadConfFile(user: UserModel): boolean;

    /**
     * Has permission to enable client application
     */
    canEnable(user: UserModel): boolean;

    /**
     * Has permission to disable client application
     */
    canDisable(user: UserModel): boolean;
}

/**
 * Device
 */
export interface IPermissionDevice {
    /**
     * Has permission to see device history
     */
    canListHistory(user: UserModel): boolean;

    /**
     * Has permission to wipe device application
     */
    canWipe(user: UserModel): boolean;
}

/**
 * Questionnaire
 */
export interface IPermissionQuestionnaire {
    /**
     * Has permission to modify case questionnaire
     */
    canModifyCaseQuestionnaire(user: UserModel): boolean;

    /**
     * Has permission to modify contact questionnaire
     */
    canModifyContactQuestionnaire(user: UserModel): boolean;

    /**
     * Has permission to modify contact follow-up questionnaire
     */
    canModifyContactFollowUpQuestionnaire(user: UserModel): boolean;

    /**
     * Has permission to modify case lab result questionnaire
     */
    canModifyCaseLabResultQuestionnaire(user: UserModel): boolean;
}

/**
 * Outbreak
 */
export interface IPermissionOutbreak {
    /**
     * Has permission to make the selected outbreak active for the current user
     */
    canMakeOutbreakActive(user: UserModel): boolean;

    /**
     * Has permission to see inconsistencies in key dates
     */
    canSeeInconsistencies(user: UserModel): boolean;
}

/**
 * Outbreak Template
 */
export interface IPermissionOutbreakTemplate {
    /**
     * Has permission to generate an outbreak from an outbreak template
     */
    canGenerateOutbreak(user: UserModel): boolean;
}

/**
 * Team
 */
export interface IPermissionTeam {
    /**
     * Has permission to list teams workload
     */
    canListWorkload(user: UserModel): boolean;
}

/**
 * Cluster
 */
export interface IPermissionCluster {
    /**
     * Has permission to list people under a cluster
     */
    canListPeople(user: UserModel): boolean;
}

/**
 * Contact
 */
export interface IPermissionRelatedContact {
    /**
     * Has permission that allows user to create a related contact ?
     */
    canCreateContact(user: UserModel): boolean;
}

/**
 * Related lab result ( used by case & contact )
 */
export interface IPermissionRelatedLabResult {
    /**
     * Has view permission ?
     */
    canViewLabResult(user: UserModel): boolean;

    /**
     * Has list permission ?
     */
    canListLabResult(user: UserModel): boolean;

    /**
     * Has create permission ?
     */
    canCreateLabResult(user: UserModel): boolean;

    /**
     * Has modify permission ?
     */
    canModifyLabResult(user: UserModel): boolean;

    /**
     * Has delete permission ?
     */
    canDeleteLabResult(user: UserModel): boolean;

    /**
     * Has restore permission ?
     */
    canRestoreLabResult(user: UserModel): boolean;

    /**
     * Has import permission ?
     */
    canImportLabResult(user: UserModel): boolean;

    /**
     * Has import permission ?
     */
    canExportLabResult(user: UserModel): boolean;
}

/**
 * Contact Bulk
 */
export interface IPermissionRelatedContactBulk {
    /**
     * Has permission that allows user to create multiple contacts at the same time ?
     */
    canBulkCreateContact(user: UserModel): boolean;
}

/**
 * Relationship
 */
export interface IPermissionRelationship {
    /**
     * Can we reverse a relationship target & source ?
     */
    canReverse(user: UserModel): boolean;

    /**
     * Can we share relationships ?
     */
    canShare(user: UserModel): boolean;
}

/**
 * Follow-up
 */
export interface IPermissionFollowUp {
    /**
     * Can we list follow-up range ?
     */
    canListDashboard(user: UserModel): boolean;

    /**
     * Can we generate follow-ups ?
     */
    canGenerate(user: UserModel): boolean;

    /**
     * Can we export dashboard follow-ups ?
     */
    canExportRange(user: UserModel): boolean;

    /**
     * Can we export daily form ?
     */
    canExportDailyForm(user: UserModel): boolean;
}

/**
 * Case / Contact / Event - Relationship
 */
export interface IPermissionRelatedRelationship {
    /**
     * Can we list relationship contacts ?
     */
    canListRelationshipContacts(user: UserModel): boolean;

    /**
     * Can we view relationship contacts ?
     */
    canViewRelationshipContacts(user: UserModel): boolean;

    /**
     * Can we create relationship contacts ?
     */
    canCreateRelationshipContacts(user: UserModel): boolean;

    /**
     * Can we modify relationship contacts ?
     */
    canModifyRelationshipContacts(user: UserModel): boolean;

    /**
     * Can we delete relationship contacts ?
     */
    canDeleteRelationshipContacts(user: UserModel): boolean;

    /**
     * Can we list relationship exposures ?
     */
    canListRelationshipExposures(user: UserModel): boolean;

    /**
     * Can we view relationship exposures ?
     */
    canViewRelationshipExposures(user: UserModel): boolean;

    /**
     * Can we create relationship exposures ?
     */
    canCreateRelationshipExposures(user: UserModel): boolean;

    /**
     * Can we modify relationship exposures ?
     */
    canModifyRelationshipExposures(user: UserModel): boolean;

    /**
     * Can we delete relationship exposures ?
     */
    canDeleteRelationshipExposures(user: UserModel): boolean;

    /**
     * Can we reverse a relationship target & source ?
     */
    canReverseRelationship(user: UserModel): boolean;

    /**
     * Can see the list of persons ( events... ) without relationships
     */
    canListPersonsWithoutRelationships(user: UserModel): boolean;

    /**
     * Has relationship export permission ( events, cases, contacts...) ?
     */
    canExportRelationships(user: UserModel): boolean;

    /**
     * Can we share relationships from a person ( case, contact, event ) ?
     */
    canShareRelationship(user: UserModel): boolean;

    /**
     * Can we change source person of a relationship ?
     */
    canChangeSource(user: UserModel): boolean;

    /**
     * Can bulk delete relationships exposures from events / cases & contacts
     */
    canBulkDeleteRelationshipExposures(user: UserModel): boolean;

    /**
     * Can bulk delete relationships contacts from events / cases & contacts
     */
    canBulkDeleteRelationshipContacts(user: UserModel): boolean;
}

/**
 * Case / Contact - Movement
 */
export interface IPermissionMovement {
    /**
     * Can we display movement map ?
     */
    canViewMovementMap(user: UserModel): boolean;

    /**
     * Can we export movement map ?
     */
    canExportMovementMap(user: UserModel): boolean;
}

/**
 * Case / Contact - Chronology
 */
export interface IPermissionChronology {
    /**
     * Can we display chronology chart ?
     */
    canViewChronologyChart(user: UserModel): boolean;
}

/**
 * Chains Of Transmission - COT
 */
export interface IPermissionChainsOfTransmission {
    /**
     * Has permission to list cot records ?
     */
    canList(user: UserModel): boolean;

    /**
     * Has permission to export cot bar chart image ?
     */
    canExportBarChart(user: UserModel): boolean;

    /**
     * Has permission to export cot graphs image ( bubble network, hierarchical network ... ) ?
     */
    canExportGraphs(user: UserModel): boolean;

    /**
     * Has permission to export cot case count map image ?
     */
    canExportCaseCountMap(user: UserModel): boolean;

    /**
     * Has permission to see bar chart
     */
    canViewBarChart(user: UserModel): boolean;

    /**
     * Has permission to see count map
     */
    canViewCaseCountMap(user: UserModel): boolean;

    /**
     * Has permission to see geospatial map
     */
    canViewGeospatialMap(user: UserModel): boolean;

    /**
     * Has permission to see bubble network
     */
    canViewBubbleNetwork(user: UserModel): boolean;

    /**
     * Has permission to modify bubble network
     */
    canModifyBubbleNetwork(user: UserModel): boolean;

    /**
     * Has permission to see hierarchical network
     */
    canViewHierarchicalNetwork(user: UserModel): boolean;

    /**
     * Has permission to modify hierarchical network
     */
    canModifyHierarchicalNetwork(user: UserModel): boolean;

    /**
     * Has permission to see timeline network date of onset
     */
    canViewTimelineNetworkDateOfOnset(user: UserModel): boolean;

    /**
     * Has permission to modify timeline network date of onset
     */
    canModifyTimelineNetworkDateOfOnset(user: UserModel): boolean;

    /**
     * Has permission to see timeline network date of last contact
     */
    canViewTimelineNetworkDateOfLastContact(user: UserModel): boolean;

    /**
     * Has permission to modify timeline network date of last contact
     */
    canModifyTimelineNetworkDateOfLastContact(user: UserModel): boolean;

    /**
     * Has permission to see timeline network date of reporting
     */
    canViewTimelineNetworkDateOfReporting(user: UserModel): boolean;

    /**
     * Has permission to modify timeline network date of reporting
     */
    canModifyTimelineNetworkDateOfReporting(user: UserModel): boolean;

    /**
     * Can view any of the cot graphs ( bubble / hierarchical ... )
     */
    canViewAnyGraph(user: UserModel): boolean;
}

/**
 * Duplicates
 */
export interface IPermissionDuplicates {
    /**
     * Has permission to list duplicate records ?
     */
    canList(user: UserModel): boolean;

    /**
     * Has permission to merge duplicate case records ?
     */
    canMergeCases(user: UserModel): boolean;

    /**
     * Has permission to merge duplicate contact records ?
     */
    canMergeContacts(user: UserModel): boolean;

    /**
     * Has permission to merge duplicate contacts of contacts records ?
     */
    canMergeContactsOfContacts(user: UserModel): boolean;

    /**
     * Has permission to merge duplicate event records ?
     */
    canMergeEvents(user: UserModel): boolean;
}

/**
 * Contact
 */
export interface IPermissionCase {
    /**
     * Has permission to generate visual id ?
     */
    canGenerateVisualId(user: UserModel): boolean;

    /**
     * Has permission to convert case to contact ?
     */
    canConvertToContact(user: UserModel): boolean;

    /**
     * Has permission to download case investigation form ?
     */
    canExportInvestigationForm(user: UserModel): boolean;

    /**
     * Has permission to download empty investigation forms ?
     */
    canExportEmptyInvestigationForms(user: UserModel): boolean;

    /**
     * Has permission to group cases by classification ?
     */
    canGroupByClassification(user: UserModel): boolean;

    /**
     * Has permission to see secondary cases for which onset date is before primary case ?
     */
    canListOnsetBeforePrimaryReport(user: UserModel): boolean;

    /**
     * Has permission to see cases with long periods between onset dates ?
     */
    canListLongPeriodBetweenOnsetDatesReport(user: UserModel): boolean;

    /**
     * Has permission to export case dossier ?
     */
    canExportDossier(user: UserModel): boolean;

    /**
     * Has permission to determine isolated cases ?
     */
    canListIsolatedCases(user: UserModel): boolean;
}

/**
 * Contact
 */
export interface IPermissionContact {
    /**
     * Has permission to generate visual id ?
     */
    canGenerateVisualId(user: UserModel): boolean;

    /**
     * Has permission to convert contact to case ?
     */
    canConvertToCase(user: UserModel): boolean;

    /**
     * Has permission to export daily follow-up list ?
     */
    canExportDailyFollowUpList(user: UserModel): boolean;

    /**
     * Has permission to export daily follow-up form ?
     */
    canExportDailyFollowUpsForm(user: UserModel): boolean;

    /**
     * Has permission to export contact dossier ?
     */
    canExportDossier(user: UserModel): boolean;
}

/**
 * Gantt Chart
 */
export interface IPermissionGanttChart {
    /**
     * Has view permission ?
     */
    canViewDelayOnsetLabTesting(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewDelayOnsetHospitalization(user: UserModel): boolean;

    /**
     * Has export permission ?
     */
    canExportDelayOnsetLabTesting(user: UserModel): boolean;

    /**
     * Has export permission ?
     */
    canExportDelayOnsetHospitalization(user: UserModel): boolean;
}

/**
 * Dashboard
 */
export interface IPermissionDashboard {
    /**
     * Has view permission ?
     */
    canViewDashboard(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewCaseSummaryDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewCasePerLocationLevelDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewCaseHospitalizedPieChartDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewCotSizeHistogramDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewEpiCurveStratifiedByClassificationDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewEpiCurveStratifiedByOutcomeDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewEpiCurveStratifiedByClassificationOverReportTimeDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewContactFollowUpReportDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewContactStatusReportDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewCaseDeceasedDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewCaseHospitalizedDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewCaseWithLessThanXCotactsDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewNewCasesInPreviousXDaysAmongKnownContactsDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewCasesRefusingTreatmentDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewNewCasesFromKnownCOTDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewCasesWithPendingLabResultsDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewCasesNotIdentifiedThroughContactsDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewContactsPerCaseMeanDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewContactsPerCaseMedianDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewContactsFromFollowUpsDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewContactsLostToFollowUpsDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewContactsNotSeenInXDaysDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewContactsBecomeCasesDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewContactsSeenDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewContactsWithSuccessfulFollowUpsDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewIndependentCOTDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewActiveCOTDashlet(user: UserModel): boolean;

    /**
     * Has view permission ?
     */
    canViewNewChainsFromContactsWhoBecameCasesDashlet(user: UserModel): boolean;

    /**
     * Has export permission ?
     */
    canExportCaseClassificationPerLocationReport(user: UserModel): boolean;

    /**
     * Has export permission ?
     */
    canExportContactFollowUpSuccessRateReport(user: UserModel): boolean;

    /**
     * Has export permission ?
     */
    canExportEpiCurve(user: UserModel): boolean;

    /**
     * Has export permission ?
     */
    canExportKpi(user: UserModel): boolean;
}
