import { IPermissionDashboard } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';

export class DashboardModel
    implements
        IPermissionDashboard {

    /**
     * Static Permissions - IPermissionDashboard
     */
    static canViewCaseSummaryDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_CASE_SUMMARY_DASHLET) : false; }
    static canViewCasePerLocationLevelDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_CASE_PER_LOCATION_LEVEL_DASHLET) : false; }
    static canViewCaseHospitalizedPieChartDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_CASE_HOSPITALIZED_PIE_CHART_DASHLET) : false; }
    static canViewCotSizeHistogramDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_COT_SIZE_HISTOGRAM_DASHLET) : false; }
    static canViewEpiCurveStratifiedByClassificationDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_EPI_CURVE_STRATIFIED_BY_CLASSIFICATION_DASHLET) : false; }
    static canViewEpiCurveStratifiedByOutcomeDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_EPI_CURVE_STRATIFIED_BY_OUTCOME_DASHLET) : false; }
    static canViewEpiCurveStratifiedByClassificationOverReportTimeDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_EPI_CURVE_STRATIFIED_BY_REPORTING_DASHLET) : false; }
    static canViewContactFollowUpReportDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_CONTACT_FOLLOW_UP_REPORT_DASHLET) : false; }
    static canViewContactStatusReportDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_CONTACT_STATUS_REPORT_DASHLET) : false; }
    static canViewCaseDeceasedDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_CASE_DECEASED_DASHLET) : false; }
    static canViewCaseHospitalizedDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_CASE_HOSPITALIZED_DASHLET) : false; }
    static canViewCaseWithLessThanXCotactsDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_CASE_WITH_LESS_THAN_X_CONTACTS_DASHLET) : false; }
    static canViewNewCasesInPreviousXDaysAmongKnownContactsDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_CASE_NEW_IN_PREVIOUS_X_DAYS_DETECTED_AMONG_KNOWN_CONTACTS_DASHLET) : false; }
    static canViewCasesRefusingTreatmentDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_CASE_REFUSING_TREATMENT_DASHLET) : false; }
    static canViewNewCasesFromKnownCOTDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_CASE_NEW_FROM_KNOWN_COT_DASHLET) : false; }
    static canViewCasesWithPendingLabResultsDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_CASE_WITH_PENDING_LAB_RESULTS_DASHLET) : false; }
    static canViewCasesNotIdentifiedThroughContactsDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_CASE_NOT_IDENTIFIED_THROUGH_CONTACTS_DASHLET) : false; }
    static canViewContactsPerCaseMeanDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_CONTACTS_PER_CASE_MEAN_DASHLET) : false; }
    static canViewContactsPerCaseMedianDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_CONTACTS_PER_CASE_MEDIAN_DASHLET) : false; }
    static canViewContactsFromFollowUpsDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_CONTACTS_FROM_FOLLOW_UP_DASHLET) : false; }
    static canViewContactsLostToFollowUpsDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_CONTACTS_LOST_TO_FOLLOW_UP_DASHLET) : false; }
    static canViewContactsNotSeenInXDaysDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_CONTACTS_NOT_SEEN_IN_X_DAYS_DASHLET) : false; }
    static canViewContactsBecomeCasesDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_CONTACTS_BECOME_CASES_DASHLET) : false; }
    static canViewContactsSeenDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_CONTACTS_SEEN_DASHLET) : false; }
    static canViewContactsWithSuccessfulFollowUpsDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_CONTACTS_SUCCESSFUL_FOLLOW_UPS_DASHLET) : false; }
    static canViewIndependentCOTDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_INDEPENDENT_COT_DASHLET) : false; }
    static canViewActiveCOTDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_ACTIVE_COT_DASHLET) : false; }
    static canViewNewChainsFromContactsWhoBecameCasesDashlet(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_VIEW_NEW_CHAINS_FROM_CONTACTS_WHO_BECAME_CASES_DASHLET) : false; }
    static canExportCaseClassificationPerLocationReport(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_EXPORT_CASE_CLASSIFICATION_PER_LOCATION_REPORT) : false; }
    static canExportContactFollowUpSuccessRateReport(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_EXPORT_CONTACT_FOLLOW_UP_SUCCESS_RATE_REPORT) : false; }
    static canExportEpiCurve(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_EXPORT_EPI_CURVE) : false; }
    static canExportKpi(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.DASHBOARD_EXPORT_KPI) : false; }
    static canViewDashboard(user: UserModel): boolean {
        // no user provided ? then we don't have access
        if (!user) {
            return false;
        }

        // check if we have at least one access to dashboard
        const canMethods: string[] = Object.getOwnPropertyNames(DashboardModel)
            .filter((propName: string) => propName.startsWith('can') && propName !== 'canViewDashboard');
        for (const canMethod of canMethods) {
            if (DashboardModel[canMethod](user)) {
                return true;
            }
        }

        // we don't have access
        return false;
    }

    /**
     * Constructor
     */
    constructor() {}

    /**
     * Permissions - IPermissionDashboard
     */
    canViewCaseSummaryDashlet(user: UserModel): boolean { return DashboardModel.canViewCaseSummaryDashlet(user); }
    canViewCasePerLocationLevelDashlet(user: UserModel): boolean { return DashboardModel.canViewCasePerLocationLevelDashlet(user); }
    canViewCaseHospitalizedPieChartDashlet(user: UserModel): boolean { return DashboardModel.canViewCaseHospitalizedPieChartDashlet(user); }
    canViewCotSizeHistogramDashlet(user: UserModel): boolean { return DashboardModel.canViewCotSizeHistogramDashlet(user); }
    canViewEpiCurveStratifiedByClassificationDashlet(user: UserModel): boolean { return DashboardModel.canViewEpiCurveStratifiedByClassificationDashlet(user); }
    canViewEpiCurveStratifiedByOutcomeDashlet(user: UserModel): boolean { return DashboardModel.canViewEpiCurveStratifiedByOutcomeDashlet(user); }
    canViewEpiCurveStratifiedByClassificationOverReportTimeDashlet(user: UserModel): boolean { return DashboardModel.canViewEpiCurveStratifiedByClassificationOverReportTimeDashlet(user); }
    canViewContactFollowUpReportDashlet(user: UserModel): boolean { return DashboardModel.canViewContactFollowUpReportDashlet(user); }
    canViewContactStatusReportDashlet(user: UserModel): boolean { return DashboardModel.canViewContactStatusReportDashlet(user); }
    canViewCaseDeceasedDashlet(user: UserModel): boolean { return DashboardModel.canViewCaseDeceasedDashlet(user); }
    canViewCaseHospitalizedDashlet(user: UserModel): boolean { return DashboardModel.canViewCaseHospitalizedDashlet(user); }
    canViewCaseWithLessThanXCotactsDashlet(user: UserModel): boolean { return DashboardModel.canViewCaseWithLessThanXCotactsDashlet(user); }
    canViewNewCasesInPreviousXDaysAmongKnownContactsDashlet(user: UserModel): boolean { return DashboardModel.canViewNewCasesInPreviousXDaysAmongKnownContactsDashlet(user); }
    canViewCasesRefusingTreatmentDashlet(user: UserModel): boolean { return DashboardModel.canViewCasesRefusingTreatmentDashlet(user); }
    canViewNewCasesFromKnownCOTDashlet(user: UserModel): boolean { return DashboardModel.canViewNewCasesFromKnownCOTDashlet(user); }
    canViewCasesWithPendingLabResultsDashlet(user: UserModel): boolean { return DashboardModel.canViewCasesWithPendingLabResultsDashlet(user); }
    canViewCasesNotIdentifiedThroughContactsDashlet(user: UserModel): boolean { return DashboardModel.canViewCasesNotIdentifiedThroughContactsDashlet(user); }
    canViewContactsPerCaseMeanDashlet(user: UserModel): boolean { return DashboardModel.canViewContactsPerCaseMeanDashlet(user); }
    canViewContactsPerCaseMedianDashlet(user: UserModel): boolean { return DashboardModel.canViewContactsPerCaseMedianDashlet(user); }
    canViewContactsFromFollowUpsDashlet(user: UserModel): boolean { return DashboardModel.canViewContactsFromFollowUpsDashlet(user); }
    canViewContactsLostToFollowUpsDashlet(user: UserModel): boolean { return DashboardModel.canViewContactsLostToFollowUpsDashlet(user); }
    canViewContactsNotSeenInXDaysDashlet(user: UserModel): boolean { return DashboardModel.canViewContactsNotSeenInXDaysDashlet(user); }
    canViewContactsBecomeCasesDashlet(user: UserModel): boolean { return DashboardModel.canViewContactsBecomeCasesDashlet(user); }
    canViewContactsSeenDashlet(user: UserModel): boolean { return DashboardModel.canViewContactsSeenDashlet(user); }
    canViewContactsWithSuccessfulFollowUpsDashlet(user: UserModel): boolean { return DashboardModel.canViewContactsWithSuccessfulFollowUpsDashlet(user); }
    canViewIndependentCOTDashlet(user: UserModel): boolean { return DashboardModel.canViewIndependentCOTDashlet(user); }
    canViewActiveCOTDashlet(user: UserModel): boolean { return DashboardModel.canViewActiveCOTDashlet(user); }
    canViewNewChainsFromContactsWhoBecameCasesDashlet(user: UserModel): boolean { return DashboardModel.canViewNewChainsFromContactsWhoBecameCasesDashlet(user); }
    canExportCaseClassificationPerLocationReport(user: UserModel): boolean { return DashboardModel.canExportCaseClassificationPerLocationReport(user); }
    canExportContactFollowUpSuccessRateReport(user: UserModel): boolean { return DashboardModel.canExportContactFollowUpSuccessRateReport(user); }
    canExportEpiCurve(user: UserModel): boolean { return DashboardModel.canExportEpiCurve(user); }
    canExportKpi(user: UserModel): boolean { return DashboardModel.canExportKpi(user); }
    canViewDashboard(user: UserModel): boolean { return DashboardModel.canViewDashboard(user); }
}
